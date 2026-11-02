const TeacherApplication = require('../models/teacherApplication.model');
const Teacher = require('../models/teacher.model');
const User = require('../models/user.model');
const { cloudinary } = require('../middleware/upload');
const crypto = require('crypto');

const ALLOWED_SUBJECTS = new Set([
    'اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'العلوم', 'الفيزياء',
    'الكيمياء', 'الأحياء', 'الجيولوجيا', 'التاريخ', 'الجغرافيا',
    'الفلسفة والمنطق', 'علم النفس والاجتماع', 'اللغة الفرنسية',
    'اللغة الألمانية', 'اللغة الإيطالية', 'البرمجة'
]);

const ALLOWED_GRADES = new Set([
    'الصف الأول الإعدادي', 'الصف الثاني الإعدادي', 'الصف الثالث الإعدادي',
    'الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'
]);

const PHONE_PATTERN = /^01[0125]\d{8}$/;
const NAME_PATTERN = /^[A-Za-z\u0621-\u063A\u0641-\u064A\u0670\u0649\s.'-]+$/u;

function normalizeName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
}

async function removeUploadedPhoto(file) {
    if (!file?.public_id) return;
    try {
        await cloudinary.uploader.destroy(file.public_id, { resource_type: 'image' });
    } catch (_) {
        // The validation response is more important than a best-effort cleanup.
    }
}

async function generateAssistantPhone() {
    let phone;
    do {
        phone = `05${crypto.randomInt(100000000, 1000000000)}`;
    } while (await User.exists({ phone }));
    return phone;
}

function validApplication({ fullName, subject, grades, phone, whatsapp }) {
    const name = normalizeName(fullName);
    const nameParts = name.split(' ').filter(Boolean);
    const selectedGrades = Array.isArray(grades) ? [...new Set(grades.map(String))] : [];

    if (nameParts.length < 4 || !NAME_PATTERN.test(name)) {
        return { error: 'اكتب الاسم الرباعي بحروف عربية أو إنجليزية فقط.' };
    }
    if (!ALLOWED_SUBJECTS.has(subject)) return { error: 'اختر مادة دراسية صحيحة.' };
    if (!selectedGrades.length || selectedGrades.some(grade => !ALLOWED_GRADES.has(grade))) {
        return { error: 'اختر مرحلة دراسية واحدة على الأقل.' };
    }
    if (!PHONE_PATTERN.test(phone) || !PHONE_PATTERN.test(whatsapp)) {
        return { error: 'رقم الهاتف ورقم واتساب يجب أن يكونا رقمين مصريين صحيحين.' };
    }
    return { name, selectedGrades };
}

exports.createApplication = async (req, res, next) => {
    try {
        const fullName = normalizeName(req.body.fullName);
        const subject = String(req.body.subject || '').trim();
        const rawGrades = req.body.grades || req.body['grades[]'];
        const grades = Array.isArray(rawGrades) ? rawGrades : (rawGrades ? [rawGrades] : []);
        const phone = String(req.body.phone || '').trim();
        const whatsapp = String(req.body.whatsapp || '').trim();
        const validation = validApplication({ fullName, subject, grades, phone, whatsapp });
        if (validation.error) {
            await removeUploadedPhoto(req.file);
            return res.status(400).json({ success: false, message: validation.error });
        }
        if (!req.file || !String(req.file.mimetype || '').startsWith('image/')) {
            return res.status(400).json({ success: false, message: 'ارفع صورة شخصية واضحة بصيغة JPG أو PNG أو WEBP.' });
        }
        if (req.file.size > 8 * 1024 * 1024) {
            await removeUploadedPhoto(req.file);
            return res.status(400).json({ success: false, message: 'حجم الصورة يجب ألا يتجاوز 8 ميجابايت.' });
        }

        const existing = await TeacherApplication.findOne({
            status: 'pending',
            $or: [{ phone }, { whatsapp }]
        });
        if (existing) {
            await removeUploadedPhoto(req.file);
            return res.status(409).json({ success: false, message: 'يوجد طلب انضمام قيد المراجعة بهذا الرقم بالفعل.' });
        }

        await TeacherApplication.create({
            fullName: validation.name,
            subject,
            grades: validation.selectedGrades,
            phone,
            whatsapp,
            photoPath: req.file.path,
            photoPublicId: req.file.public_id || ''
        });
        return res.status(201).json({ success: true, message: 'تم إرسال طلب الانضمام بنجاح. سنراجع بياناتك ونتواصل معك قريبًا.' });
    } catch (error) {
        next(error);
    }
};

exports.listApplications = async (req, res, next) => {
    try {
        const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : null;
        const applications = await TeacherApplication.find(status ? { status } : {})
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, applications });
    } catch (error) {
        next(error);
    }
};

exports.approveApplication = async (req, res, next) => {
    let application;
    let teacher;
    let teacherAccount;
    let assistantAccount;
    try {
        // Claim a pending request atomically, so two admin clicks cannot
        // create two teacher profiles for the same application.
        application = await TeacherApplication.findOneAndUpdate(
            { _id: req.params.id, status: 'pending' },
            { $set: { status: 'approved', reviewedAt: new Date(), reviewedBy: req.user._id } },
            { new: true }
        );
        if (!application) {
            const exists = await TeacherApplication.exists({ _id: req.params.id });
            return res.status(exists ? 409 : 404).json({ success: false, message: exists ? 'تمت مراجعة هذا الطلب بالفعل.' : 'طلب الانضمام غير موجود.' });
        }

        const usedPhone = await User.exists({ phone: application.phone });
        if (usedPhone) {
            await TeacherApplication.updateOne({ _id: application._id }, {
                $set: { status: 'pending', reviewedAt: null, reviewedBy: null }
            });
            return res.status(409).json({
                success: false,
                message: 'رقم تواصل المدرس مستخدم في حساب آخر. غيّر الرقم في الطلب ثم أعد القبول.'
            });
        }

        teacher = await Teacher.create({
            name: application.fullName,
            subjectAr: application.subject,
            grades: application.grades,
            bio: 'مدرس جديد على منصة EDGE Academy',
            contactPhone: application.phone,
            whatsapp: application.whatsapp
        });

        const teacherPassword = crypto.randomBytes(6).toString('base64url');
        const assistantPhone = await generateAssistantPhone();
        const assistantPassword = crypto.randomBytes(6).toString('base64url');
        const accountData = {
            teacherId: teacher._id,
            grade: 'All',
            governorate: 'الكل',
            birthDate: new Date()
        };

        teacherAccount = await User.create({
            ...accountData,
            phone: application.phone,
            parentPhone: application.phone,
            password: teacherPassword,
            role: 'teacher',
            isTeacherAccount: true,
            firstName: application.fullName,
            lastName: 'المدرس',
            username: `teacher_${application.phone}`,
            nationalId: `teacher_${application.phone}`
        });
        assistantAccount = await User.create({
            ...accountData,
            phone: assistantPhone,
            parentPhone: assistantPhone,
            password: assistantPassword,
            role: 'assistant',
            firstName: `مساعد ${application.fullName}`,
            lastName: 'التعليمي',
            username: `helper_${assistantPhone}`,
            nationalId: `helper_${assistantPhone}`
        });

        teacher.teacherAccountPhone = application.phone;
        await teacher.save();
        application.teacherId = teacher._id;
        await application.save();

        res.json({
            success: true,
            message: 'تم قبول الطلب وإنشاء حساب المدرس وحساب المساعد.',
            teacher,
            teacherAccount: { phone: application.phone, password: teacherPassword },
            assistantAccount: { phone: assistantPhone, password: assistantPassword }
        });
    } catch (error) {
        // Make acceptance all-or-nothing if account creation fails midway.
        await Promise.allSettled([
            teacherAccount ? User.deleteOne({ _id: teacherAccount._id }) : Promise.resolve(),
            assistantAccount ? User.deleteOne({ _id: assistantAccount._id }) : Promise.resolve(),
            teacher ? Teacher.deleteOne({ _id: teacher._id }) : Promise.resolve(),
            application ? TeacherApplication.updateOne({ _id: application._id, teacherId: null }, {
                $set: { status: 'pending', reviewedAt: null, reviewedBy: null }
            }) : Promise.resolve()
        ]);
        next(error);
    }
};

exports.rejectApplication = async (req, res, next) => {
    try {
        const application = await TeacherApplication.findById(req.params.id);
        if (!application) return res.status(404).json({ success: false, message: 'طلب الانضمام غير موجود.' });
        if (application.status !== 'pending') return res.status(409).json({ success: false, message: 'تمت مراجعة هذا الطلب بالفعل.' });

        application.status = 'rejected';
        application.reviewedAt = new Date();
        application.reviewedBy = req.user._id;
        await application.save();
        res.json({ success: true, message: 'تم رفض طلب الانضمام.' });
    } catch (error) {
        next(error);
    }
};
