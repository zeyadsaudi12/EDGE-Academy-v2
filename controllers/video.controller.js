const Video = require('../models/video.model');
const User = require('../models/user.model');
const Teacher = require('../models/teacher.model');
const mongoose = require('mongoose');

const isTrue = value => value === true || value === 1 || value === '1' || value === 'true';

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
        const updateData = { title, link, examLink, startDate, endDate, hidden };
        if (price !== undefined) {
            updateData.price = price === '' || price === null ? null : Number(price);
        }
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
        const studentId = String(req.user._id);
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
        const isAdminCatalogue = req.query.includeHidden === 'true' && req.user?.role === 'admin';
        const videos = await Video.find(isAdminCatalogue ? {} : { hidden: { $ne: true } }).sort({ createdAt: -1 }).lean();
        if (isAdminCatalogue) return res.json(videos);
        const visibleTeacherIds = new Set((await Teacher.find({ hidden: { $ne: true } }).select('_id').lean()).map(t => String(t._id)));
        res.json(videos.filter(video => !video.teacherId || visibleTeacherIds.has(String(video.teacherId))).map(({ link, videoPath, bookletFiles, homeworkFiles, ...safeVideo }) => safeVideo));
    } catch (err) {
        next(err);
    }
};

exports.createVideo = async (req, res, next) => {
    try {
        const { title, link, price, teacherId, playlistName, examLink, requiredExamId, startDate, endDate, hidden, scheduleGroup, courseId, releaseAfterDays } = req.body;
        // Handle both 'grades' and 'grades[]' sent by FormData
        const rawGrades = req.body['grades[]'] || req.body['grades'];
        const imageFile = req.files && req.files['image'] ? req.files['image'][0] : null;
        const videoFile = req.files && req.files['video'] ? req.files['video'][0] : null;

        const imagePath = (imageFile ? imageFile.path : (req.body.image || req.body.imagePath)) || 'imges/logo-light-mode.png';
        const gradesArray = rawGrades ? (Array.isArray(rawGrades) ? rawGrades : rawGrades.split(",").map(g => g.trim())) : [];
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
            price: price === '' || price === null || price === undefined ? null : Number(price),
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
            hidden: isTrue(hidden),
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
        const isPrivileged = ['admin', 'teacher', 'assistant'].includes(req.user.role);
        if (video.hidden && !isPrivileged) return res.status(404).json({ success: false, message: 'الفيديو غير موجود' });
        if (!isPrivileged && Array.isArray(video.grades) && video.grades.length && !video.grades.includes(req.user.grade)) {
            return res.status(403).json({ success: false, message: 'هذه المحاضرة غير متاحة لصفك الدراسي' });
        }
        const subscribed = (req.user.subscribedVideos || []).some(id => String(id) === String(video._id));
        const courseSubscribed = video.courseId && (req.user.subscribedCourses || []).some(e => String(e.courseId) === String(video.courseId));
        const isFree = Number(video.price || 0) === 0;
        if (!isPrivileged && !subscribed && !courseSubscribed && !isFree) {
            return res.status(403).json({ success: false, message: 'يلزم اشتراك صالح لمشاهدة هذه المحاضرة' });
        }
        if (video.teacherId && mongoose.Types.ObjectId.isValid(video.teacherId) && req.query.includeHidden !== 'true') {
            const teacher = await Teacher.findById(video.teacherId).select('hidden').lean();
            if (teacher && teacher.hidden) return res.status(404).json({ success: false, message: 'الفيديو غير موجود' });
        }
        res.json({ success: true, video });
    } catch (err) {
        next(err);
    }
};

exports.getVideoWatchers = async (req, res, next) => {
    try {
        const videoId = req.params.id;
        const video = await Video.findById(videoId).select('teacherId').lean();
        if (!video) return res.status(404).json({ success: false, message: 'الفيديو غير موجود' });
        if (req.user.role === 'teacher' && String(video.teacherId) !== String(req.user.teacherId)) {
            return res.status(403).json({ success: false, message: 'لا تملك صلاحية قائمة المشاهدين' });
        }
        const query = {
            $or: [
                { subscribedVideos: videoId },
                ...(mongoose.Types.ObjectId.isValid(videoId) ? [{ subscribedVideos: new mongoose.Types.ObjectId(videoId) }] : [])
            ]
        };

        const watchers = await User.find(query)
            .select('_id firstName lastName phone grade governorate')
            .lean();

        const watcherRows = watchers.map(student => ({
            ...student,
            name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || '—',
            governorate: student.governorate || '—'
        }));
        res.json({ success: true, watchers: watcherRows });
    } catch (err) {
        next(err);
    }
};
