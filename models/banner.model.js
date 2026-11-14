const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    imagePath: { type: String, required: true },
    title: { type: String, default: '' },
    link: { type: String, default: '' },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

bannerSchema.index({ order: 1, createdAt: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
