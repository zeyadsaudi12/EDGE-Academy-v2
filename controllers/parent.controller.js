const Parent = require('../models/parent.model');
const User = require('../models/user.model');
const Teacher = require('../models/teacher.model');
const Video = require('../models/video.model');
const Course = require('../models/course.model');
const Exam = require('../models/exam.model');
const Attendance = require('../models/attendance.model');
const mongoose = require('mongoose');

const publicParent = parent => ({ _id: parent._id, name: parent.name, phone: parent.phone, studentEmail: parent.studentEmail, studentId: parent.studentId });

exports.register = async (req, res, next) => {
    try {
        const { name, phone, password, studentEmail } = req.body;
        const email = String(studentEmail || '').trim().toLowerCase();
        if (!name || !phone || !password || !email) return res.status(400).json({ success: false, message: 'أكمل جميع البيانات المطلوبة' });
        if (!/^01[0125]\d{8}$/.test(phone)) return res.status(400).json({ success: false, message: 'رقم الهاتف غير صحيح' });
        const student = await User.findOne({ email, role: 'student' });
        if (!student) return res.status(404).json({ success: false, message: 'لا يوجد طالب مسجل بهذا البريد الإلكتروني' });
        if (await Parent.findOne({ phone })) return res.status(400).json({ success: false, message: 'رقم الهاتف مسجل بالفعل' });
        const parent = await Parent.create({ name: String(name).trim(), phone, password, studentEmail: email, studentId: student._id });
        res.status(201).json({ success: true, parent: publicParent(parent) });
    } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
    try {
        const parent = await Parent.findOne({ phone: req.body.phone, password: req.body.password });
        if (!parent) return res.status(401).json({ success: false, message: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
        res.json({ success: true, parent: publicParent(parent) });
    } catch (err) { next(err); }
};

exports.dashboard = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'معرف ولي الأمر غير صالح' });
        const parent = await Parent.findById(req.params.id).lean();
        if (!parent) return res.status(404).json({ success: false, message: 'حساب ولي الأمر غير موجود' });
        const student = await User.findById(parent.studentId).select('-password').lean();
        if (!student) return res.status(404).json({ success: false, message: 'حساب الطالب المرتبط غير موجود' });
        const [allVideos, allCourses, allExams, allTeachers, attendance] = await Promise.all([
            Video.find({ hidden: { $ne: true } }).lean(), Course.find({ hidden: { $ne: true } }).lean(),
            Exam.find({ 'results.studentId': String(student._id) }).lean(), Teacher.find().lean(),
            Attendance.find({ $or: [{ studentId: student._id }, { studentId: String(student._id) }, { studentPhone: student.phone }] }).sort({ scannedAt: -1 }).lean()
        ]);
        const subscribed = new Set((student.subscribedVideos || []).map(String));
        const studentVideos = allVideos.filter(v => subscribed.has(String(v._id)));
        const videoMap = new Map(allVideos.map(v => [String(v._id), v]));
        const teacherIds = new Set([...studentVideos.map(v => String(v.teacherId || '')).filter(Boolean), ...attendance.map(a => String(videoMap.get(String(a.videoId))?.teacherId || '')).filter(Boolean)]);
        const teachers = allTeachers.filter(t => teacherIds.has(String(t._id)) || (t.grades || []).includes(student.grade));
        const selectedTeacherId = req.query.teacherId && teachers.some(t => String(t._id) === String(req.query.teacherId)) ? String(req.query.teacherId) : '';
        const filteredAttendance = selectedTeacherId ? attendance.filter(a => String(videoMap.get(String(a.videoId))?.teacherId || '') === selectedTeacherId) : attendance;
        const results = allExams.map(exam => { const r = (exam.results || []).find(x => String(x.studentId) === String(student._id)); return r ? { examId: exam._id, title: exam.title, teacherName: exam.teacherName, total: exam.totalMarks, ...r } : null; }).filter(Boolean);
        const percentage = results.length ? Math.round(results.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0) / results.length) : null;
        res.json({ success: true, parent: publicParent(parent), student, teachers, selectedTeacherId, stats: { videos: studentVideos.length, courses: (student.subscribedCourses || []).length, exams: results.length, examAverage: percentage, attendance: filteredAttendance.length }, attendance: filteredAttendance, results, videos: studentVideos.map(v => ({ _id: v._id, title: v.title, teacherId: v.teacherId, playlistName: v.playlistName })) });
    } catch (err) { next(err); }
};
