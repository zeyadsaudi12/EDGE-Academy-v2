const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, default: 0 },
    imagePath: { type: String, default: "" },
    grades: { type: [String], default: [] },
    teacherId: { type: String, default: null },
    hidden: { type: Boolean, default: false }
}, { timestamps: true });

// Supports the public catalogue order/filter without scanning all courses.
courseSchema.index({ hidden: 1, createdAt: -1 });

module.exports = mongoose.model('Course', courseSchema);
