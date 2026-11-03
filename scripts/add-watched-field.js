const fs = require('fs');
let userModel = fs.readFileSync('models/user.model.js', 'utf8');

if (!userModel.includes('watchedVideos')) {
    userModel = userModel.replace(
        "subscribedVideos: { \n        type: [mongoose.Schema.Types.Mixed], \n        default: [] \n    },",
        `subscribedVideos: { 
        type: [mongoose.Schema.Types.Mixed], 
        default: [] 
    },
    watchedVideos: {
        type: [{
            videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
            watchedAt: { type: Date, default: Date.now },
            watchCount: { type: Number, default: 1 }
        }],
        default: []
    },`
    );

    fs.writeFileSync('models/user.model.js', userModel, 'utf8');
    console.log('✅ Added watchedVideos field to User model');
} else {
    console.log('ℹ️ watchedVideos field already present in User model');
}

