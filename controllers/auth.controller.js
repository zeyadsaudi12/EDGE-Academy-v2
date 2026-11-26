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
        const educationType = req.body.educationType === 'university' ? 'university' : 'school';
        const { username, firstName, secondName, thirdName, lastName, birthDate, phone, nationalId, governorate, password, university, faculty, academicYear, major } = req.body;
        let { parentPhone, grade, section, secondLanguage } = req.body;

        if (educationType === 'university') {
            if (!faculty || !academicYear) {
                return res.status(400).json({ success: false, message: 'الرجاء اختيار الكلية والفرقة الدراسية للطالب الجامعي' });
            }
            grade = academicYear;
            parentPhone = parentPhone ? String(parentPhone).trim() : '';
        } else {
            if (!parentPhone) {
                return res.status(400).json({ success: false, message: 'رقم هاتف ولي الأمر مطلوب لطلاب المدارس' });
            }
            if (!grade) {
                return res.status(400).json({ success: false, message: 'الرجاء اختيار الصف الدراسي' });
            }
        }

        if (!username || !firstName || !secondName || !thirdName || !lastName || !birthDate || !phone || !nationalId || !governorate || !password) {
            return res.status(400).json({ success: false, message: 'الرجاء ملء جميع الحقول المطلوبة' });
        }

        const arabicNamePattern = /^[\u0621-\u063A\u0641-\u064A\u0670\u0649\s]+$/;
        const nameParts = [firstName, secondName, thirdName, lastName].map(name => String(name).trim().replace(/\s+/g, ' '));
        if (nameParts.some(name => !arabicNamePattern.test(name))) {
            return res.status(400).json({ success: false, message: 'الاسم الأول والثاني والثالث والأخير يجب كتابتهم باللغة العربية فقط' });
        }

        // Usernames are displayed in admin tables and used in attendance
        // lookups, so keep them to a predictable, safe character set.
        const normalizedUsername = String(username).trim();
        if (!/^[A-Za-z0-9._-]{3,40}$/.test(normalizedUsername)) {
            return res.status(400).json({ success: false, message: 'اسم المستخدم يجب أن يكون من 3 إلى 40 حرفاً إنجليزياً أو رقماً (._- مسموحة)' });
        }

        const phoneRegex = /^01[0125]\d{8}$/;
        if (!phoneRegex.test(phone) || (parentPhone && !phoneRegex.test(parentPhone))) {
            return res.status(400).json({ success: false, message: 'رقم الهاتف غير صحيح' });
        }

        const existingUser = await User.findOne({ $or: [{ phone }, { nationalId }, { username: normalizedUsername }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'رقم الهاتف، الرقم القومي أو اسم المستخدم مسجل مسبقاً' });
        }

        if (String(password).length < 8) {
            return res.status(400).json({ success: false, message: 'كلمة المرور يجب ألا تقل عن 8 أحرف' });
        }
        const hashedPassword = await bcrypt.hash(String(password), 12);
        const newUser = new User({
            username: normalizedUsername,
            firstName: nameParts[0],
            secondName: nameParts[1],
            thirdName: nameParts[2],
            lastName: nameParts[3],
            birthDate,
            phone,
            parentPhone: parentPhone || '',
            nationalId,
            governorate,
            grade,
            educationType,
            university: university || '',
            faculty: faculty || '',
            academicYear: academicYear || '',
            major: major || '',
            section: section || '',
            secondLanguage: secondLanguage || '',
            password: hashedPassword,
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
            } else {
                deviceId = String(deviceId).trim();
                if (!/^[A-Za-z0-9_-]{8,128}$/.test(deviceId)) {
                    deviceId = 'dev_' + crypto.randomBytes(16).toString('hex');
                }
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
        const { deviceId } = req.body;
        // The signed session is the only trusted identity.  Never accept a
        // user id from the browser here, otherwise one account can update
        // another account's device/online state.
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.role === 'student' && deviceId) {
            const safeDeviceId = String(deviceId).trim();
            const devices = user.devices || [];
            const found = /^[A-Za-z0-9_-]{8,128}$/.test(safeDeviceId) && devices.some(d => d.deviceId === safeDeviceId);

            if (!found) {
                if (devices.length === 0 && /^[A-Za-z0-9_-]{8,128}$/.test(safeDeviceId)) {
                    user.devices.push({
                        deviceId: safeDeviceId,
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
