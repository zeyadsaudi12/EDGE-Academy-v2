require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/user.model');

const phone = String(process.env.ADMIN_PHONE || '').trim();
const password = String(process.env.ADMIN_PASSWORD || '');
const username = String(process.env.ADMIN_USERNAME || `admin_${phone}`).trim();

async function createAdmin() {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
    if (!/^01[0125]\d{8}$/.test(phone)) throw new Error('ADMIN_PHONE must be a valid Egyptian mobile number.');
    if (password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters long.');
    if (!username) throw new Error('ADMIN_USERNAME is required.');

    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });

    const existing = await User.findOne({ $or: [{ phone }, { username }] }).lean();
    if (existing) throw new Error('An account already exists with this phone number or username. No changes were made.');

    const admin = new User({
        username,
        firstName: String(process.env.ADMIN_FIRST_NAME || 'مدير').trim(),
        lastName: String(process.env.ADMIN_LAST_NAME || 'المنصة').trim(),
        // These legacy required profile fields are not used for authentication.
        birthDate: new Date('1990-01-01T00:00:00.000Z'),
        phone,
        parentPhone: phone,
        nationalId: `admin-${phone}`,
        governorate: 'إدارة المنصة',
        grade: 'إدارة',
        password,
        role: 'admin',
        devices: []
    });

    await admin.save();
    console.log(`Admin account created successfully for ${phone}.`);
}

createAdmin()
    .catch(error => {
        console.error(`Admin account was not created: ${error.message}`);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
