const TeacherApplication = require('../models/teacherApplication.model');
const Teacher = require('../models/teacher.model');

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
        const grades = Array.isArray(req.body.grades) ? req.body.grades : [];
        const phone = String(req.body.phone || '').trim();
        const whatsapp = String(req.body.whatsapp || '').trim();
        const validation = validApplication({ fullName, subject, grades, phone, whatsapp });
        if (validation.error) return res.status(400).json({ success: false, message: validation.error });

        const existing = await TeacherApplication.findOne({
            status: 'pending',
            $or: [{ phone }, { whatsapp }]
        });
        if (existing) {
            return res.status(409).json({ success: false, message: 'يوجد طلب انضمام قيد المراجعة بهذا الرقم بالفعل.' });
        }

        await TeacherApplication.create({
            fullName: validation.name,
            subject,
            grades: validation.selectedGrades,
            phone,
            whatsapp
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
    try {
        // Claim a pending request atomically, so two admin clicks cannot
        // create two teacher profiles for the same application.
        const application = await TeacherApplication.findOneAndUpdate(
            { _id: req.params.id, status: 'pending' },
            { $set: { status: 'approved', reviewedAt: new Date(), reviewedBy: req.user._id } },
            { new: true }
        );
        if (!application) {
            const exists = await TeacherApplication.exists({ _id: req.params.id });
            return res.status(exists ? 409 : 404).json({ success: false, message: exists ? 'تمت مراجعة هذا الطلب بالفعل.' : 'طلب الانضمام غير موجود.' });
        }

        let teacher;
        try {
            teacher = await Teacher.create({
                name: application.fullName,
                subjectAr: application.subject,
                grades: application.grades,
                bio: 'مدرس جديد على منصة EDGE Academy',
                contactPhone: application.phone,
                whatsapp: application.whatsapp
            });
            application.teacherId = teacher._id;
            await application.save();
        } catch (error) {
            // Do not leave a request marked approved when profile creation failed.
            await TeacherApplication.updateOne({ _id: application._id, teacherId: null }, {
                $set: { status: 'pending', reviewedAt: null, reviewedBy: null }
            });
            throw error;
        }

        res.json({ success: true, message: 'تم قبول الطلب وإضافة المدرس إلى المنصة.', teacher });
    } catch (error) {
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
