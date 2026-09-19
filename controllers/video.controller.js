const Video = require('../models/video.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

exports.toggleVideo = async (req, res, next) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ success: false, message: 'المحاضرة غير موجودة' });
        video.closed = !video.closed; // عكس الحالة الحالية
        await video.save();
        res.json({ success: true, closed: video.closed });
    } catch (err) {
        next(err);
    }
};

exports.toggleVisibility = async (req, res, next) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ success: false, message: 'المحاضرة غير موجودة' });
        video.hidden = !video.hidden; // عكس الحالة الحالية
        await video.save();
        res.json({ success: true, hidden: video.hidden });
    } catch (err) {
        next(err);
    }
};

exports.updateVideo = async (req, res, next) => {
    try {
        const { title, price, link, examLink, requiredExamId, bookletFiles, homeworkFiles, startDate, endDate, hidden, courseId, releaseAfterDays } = req.body;
        const updateData = { title, price, link, examLink, startDate, endDate, hidden };
        if (requiredExamId !== undefined) updateData.requiredExamId = requiredExamId;
        if (bookletFiles !== undefined) updateData.bookletFiles = bookletFiles;
        if (homeworkFiles !== undefined) updateData.homeworkFiles = homeworkFiles;
        if (courseId !== undefined) updateData.courseId = courseId;
        if (releaseAfterDays !== undefined) updateData.releaseAfterDays = Number(releaseAfterDays) || 0;
        const video = await Video.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!video) return res.status(404).json({ success: false, message: 'المحاضرة غير موجودة' });
        res.json({ success: true, video });
    } catch (err) {
        next(err);
    }
};

exports.deleteVideo = async (req, res, next) => {
    try {
        await Video.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};

exports.likeVideo = async (req, res, next) => {
    try {
        const { studentId } = req.body;
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ success: false, message: 'المحاضرة غير موجودة' });

        if (!video.likes) video.likes = [];
        const index = video.likes.indexOf(studentId);
        let liked = false;

        if (index > -1) {
            video.likes.splice(index, 1); // إلغاء الإعجاب
        } else {
            video.likes.push(studentId); // الإعجاب
            liked = true;
        }

        await video.save();
        res.json({ success: true, liked, likesCount: video.likes.length, likes: video.likes });
    } catch (err) {
        next(err);
    }
};

exports.getAllVideos = async (req, res, next) => {
    try {
        const videos = await Video.find().sort({ createdAt: -1 }).lean();
        res.json(videos);
    } catch (err) {
        next(err);
    }
};

exports.createVideo = async (req, res, next) => {
    try {
        const { title, link, price, grades, teacherId, playlistName, examLink, requiredExamId, startDate, endDate, hidden, scheduleGroup, courseId, releaseAfterDays } = req.body;
        const imageFile = req.files && req.files['image'] ? req.files['image'][0] : null;
        const videoFile = req.files && req.files['video'] ? req.files['video'][0] : null;

        const imagePath = imageFile ? imageFile.path : req.body.image;
        const gradesArray = grades ? (Array.isArray(grades) ? grades : grades.split(",").map(g => g.trim())) : [];
        const videoPath = videoFile ? videoFile.path : '';

        // Process booklet files
        const bookletFiles = [];
        if (req.files && req.files['bookletFiles']) {
            req.files['bookletFiles'].forEach(f => {
                const sizeStr = f.size >= 1048576 
                    ? (f.size / 1048576).toFixed(1) + ' MB' 
                    : (f.size / 1024).toFixed(1) + ' KB';
                bookletFiles.push({
                    name: f.originalname,
                    url: f.path,
                    size: sizeStr
                });
            });
        }

        // Process homework files
        const homeworkFiles = [];
        if (req.files && req.files['homeworkFiles']) {
            req.files['homeworkFiles'].forEach(f => {
                const sizeStr = f.size >= 1048576 
                    ? (f.size / 1048576).toFixed(1) + ' MB' 
                    : (f.size / 1024).toFixed(1) + ' KB';
                homeworkFiles.push({
                    name: f.originalname,
                    url: f.path,
                    size: sizeStr
                });
            });
        }

        let parsedScheduleGroup = undefined;
        if (scheduleGroup) {
            try {
                parsedScheduleGroup = typeof scheduleGroup === 'string' ? JSON.parse(scheduleGroup) : scheduleGroup;
            } catch (e) {
                console.error("Error parsing scheduleGroup:", e);
            }
        }

        const newVideo = new Video({
            title,
            link,
            price: Number(price) || 0,
            imagePath,
            videoPath,
            grades: gradesArray,
            teacherId: teacherId || null,
            playlistName: playlistName || "", 
            examLink: examLink || "", 
            requiredExamId: requiredExamId || "",
            bookletFiles,
            homeworkFiles,
            courseId: courseId || "",
            releaseAfterDays: Number(releaseAfterDays) || 0,
            startDate: startDate || "",
            endDate: endDate || "",
            hidden: hidden === 'true' || hidden === true,
            scheduleGroup: parsedScheduleGroup
        });

        await newVideo.save();
        res.status(201).json({ success: true, video: newVideo });
    } catch (err) {
        next(err);
    }
};

exports.getVideoById = async (req, res, next) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ success: false, message: 'الفيديو غير موجود' });
        res.json({ success: true, video });
    } catch (err) {
        next(err);
    }
};

exports.getVideoWatchers = async (req, res, next) => {
    try {
        const videoId = req.params.id;
        const query = {
            $or: [
                { subscribedVideos: videoId },
                ...(mongoose.Types.ObjectId.isValid(videoId) ? [{ subscribedVideos: new mongoose.Types.ObjectId(videoId) }] : [])
            ]
        };

        const watchers = await User.find(query)
            .select('_id firstName lastName phone grade parentPhone')
            .lean();

        res.json({ success: true, watchers });
    } catch (err) {
        next(err);
    }
};
