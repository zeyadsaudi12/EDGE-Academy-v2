const User = require('../models/user.model');
const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { COOKIE_NAME, signSession } = require('../middleware/auth');

const sessionCookie = () => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/'
});

exports.register = async (req, res, next) => {
    try {
        const { username, firstName, lastName, birthDate, phone, parentPhone, nationalId, governorate, grade, section, secondLanguage, password } = req.body;

        if (!username || !firstName || !lastName || !birthDate || !phone || !parentPhone || !nationalId || !governorate || !grade || !password) {
            return res.status(400).json({ success: false, message: 'الرجاء ملء جميع الحقول المطلوبة' });
        }

        const phoneRegex = /^01[0125]\d{8}$/;
        if (!phoneRegex.test(phone) || (parentPhone && !phoneRegex.test(parentPhone))) {
            return res.status(400).json({ success: false, message: 'رقم الهاتف غير صحيح' });
        }

        const existingUser = await User.findOne({ $or: [{ phone }, { nationalId }, { username }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'رقم الهاتف، الرقم القومي أو اسم المستخدم مسجل مسبقاً' });
        }

        if (String(password).length < 8) {
            return res.status(400).json({ success: false, message: 'كلمة المرور يجب ألا تقل عن 8 أحرف' });
        }
        const hashedPassword = await bcrypt.hash(String(password), 12);
        const newUser = new User({
            username, firstName, lastName, birthDate, phone, parentPhone, nationalId, governorate, grade, section, secondLanguage, password: hashedPassword,
            devices: []
        });

        await newUser.save();
        const user = newUser.toObject();
        delete user.password;
        res.status(201).json({ success: true, user });
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { phone, password, deviceName } = req.body;
        let { deviceId } = req.body;

        if (!phone || !password) return res.status(400).json({ success: false, message: 'رقم الهاتف وكلمة المرور مطلوبان' });
        const user = await User.findOne({ phone }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
        }
        // Migrate legacy plaintext passwords only after a successful login.
        const storedPassword = user.password || '';
        const suppliedPassword = String(password);
        const validPassword = storedPassword.startsWith('$2')
            ? await bcrypt.compare(suppliedPassword, storedPassword)
            : suppliedPassword.length === storedPassword.length && crypto.timingSafeEqual(Buffer.from(suppliedPassword), Buffer.from(storedPassword));
        if (!validPassword) return res.status(401).json({ success: false, message: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
        if (!storedPassword.startsWith('$2')) user.password = await bcrypt.hash(String(password), 12);

        // فحص أمان الأجهزة للطلاب
        if (user.role === 'student') {
            if (!user.devices) user.devices = [];
            
            if (!deviceId) {
                deviceId = 'dev_' + crypto.randomBytes(16).toString('hex');
            }

            const foundIndex = user.devices.findIndex(d => d.deviceId === deviceId);

            if (foundIndex !== -1) {
                user.devices[foundIndex].ip = req.ip || 'unknown';
                user.devices[foundIndex].lastUsed = new Date();
            } else {
                if (user.devices.length >= 2) {
                    return res.status(403).json({
                        success: false,
                        message: '❌ لقد تم الوصول للحد الأقصى للأجهزة المسموح بها (جهازين). يرجى تسجيل الخروج من أجهزتك الأخرى أولاً أو التواصل مع الإدارة لإعادة ضبط حسابك.'
                    });
                }

                user.devices.push({
                    deviceId,
                    deviceName: deviceName || 'متصفح ويب',
                    ip: req.ip || 'unknown',
                    lastUsed: new Date()
                });
            }

            user.lastActive = new Date();
            await user.save();
        }

        const userData = user.toObject();
        delete userData.password;
        if (deviceId) {
            userData.deviceId = deviceId;
        }

        let sessionToken;
        try {
            sessionToken = signSession(user);
        } catch (sessionError) {
            console.error('Unable to create login session:', sessionError.message);
            return res.status(503).json({
                success: false,
                message: 'خدمة تسجيل الدخول تحتاج إعداداً من إدارة المنصة. يرجى المحاولة لاحقاً.'
            });
        }

        res.cookie(COOKIE_NAME, sessionToken, sessionCookie());
        res.json({ success: true, user: userData, deviceId });
    } catch (err) {
        next(err);
    }
};

exports.logout = (req, res) => {
    res.clearCookie(COOKIE_NAME, sessionCookie());
    res.json({ success: true });
};

exports.ping = async (req, res, next) => {
    try {
        const { userId, deviceId } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: 'ID required' });

        if (!mongoose.Types.ObjectId.isValid(userId) || userId === 'admin-master-id') {
            return res.json({ success: true, note: 'Skipped invalid student ID' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.role === 'student' && deviceId) {
            const devices = user.devices || [];
            const found = devices.some(d => d.deviceId === deviceId);

            if (!found) {
                if (devices.length === 0) {
                    user.devices.push({
                        deviceId,
                        deviceName: 'جهاز مسجل تلقائياً',
                        ip: req.ip || 'unknown',
                        lastUsed: new Date()
                    });
                } else {
                    return res.status(403).json({ success: false, message: 'device_not_registered' });
                }
            }
        }

        user.lastActive = new Date();
        await user.save();
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};

exports.online = async (req, res, next) => {
    try {
        const activeThreshold = new Date(Date.now() - 2 * 60 * 1000);
        const onlineUsers = await User.find({
            lastActive: { $gte: activeThreshold }
        }).select('firstName lastName phone grade role lastActive');
        res.json(onlineUsers);
    } catch (err) {
        next(err);
    }
};
