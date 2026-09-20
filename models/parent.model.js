const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    studentEmail: { type: String, required: true, trim: true, lowercase: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Parent', parentSchema);
