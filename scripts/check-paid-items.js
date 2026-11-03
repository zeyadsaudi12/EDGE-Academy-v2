require('dotenv').config();
const mongoose = require('mongoose');

async function checkData() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Video = require('./models/video.model');
    const Course = require('./models/course.model');
    const videos = await Video.find({ price: { $gt: 0 } }).limit(3);
    console.log('Paid videos count:', videos.length);
    videos.forEach(v => console.log('Video:', v.title, 'Price:', v.price, 'ID:', v._id));
    
    const courses = await Course.find().limit(3);
    console.log('Courses count:', courses.length);
    courses.forEach(c => console.log('Course:', c.title, 'Price:', c.price, 'ID:', c._id));
    
    await mongoose.disconnect();
}

checkData().catch(console.error);
