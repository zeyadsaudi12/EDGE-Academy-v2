const User = require('../models/user.model');
const mongoose = require('mongoose');
const crypto = require('crypto');

exports.register = async (req, res, next) => {
    try {
        const { username, firstName, lastName, birthDate, phone, parentPhone, nationalId, governorate, grade, section, secondLanguage, password } = req.body;

        if (!username || !firstName || !lastName || !phone || !nationalId || !password) {
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

        const newUser = new User({
            username, firstName, lastName, birthDate, phone, parentPhone, nationalId, governorate, grade, section, secondLanguage, password,
            devices: []
        });

        await newUser.save();
        res.status(201).json({ success: true, user: newUser });
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { phone, password, deviceName } = req.body;
        let { deviceId } = req.body;

        // التحقق من حساب الأدمن المخصص
        if (phone === '01556448880' && password === 'masar2027@agency') {
            return res.json({ 
                success: true, 
                user: { 
                    _id: "admin-master-id", 
                    role: 'admin', 
                    firstName: 'الإدارة', 
                    lastName: '', 
                    phone: '01556448880' 
                } 
            });
        }

        const user = await User.findOne({ phone, password });
        if (!user) {
            return res.status(401).json({ success: false, message: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
        }

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

        res.json({ success: true, user: userData, deviceId });
    } catch (err) {
        next(err);
    }
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
