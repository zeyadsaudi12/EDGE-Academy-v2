const Exam = require('../models/exam.model');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

// ملفات الامتحانات تُرفع إلى Cloudinary، ولذلك يكون file.path رابطاً في الإنتاج
// وليس مساراً محلياً يمكن قراءته بـ fs مباشرة.
async function readUploadedFile(filePath) {
    if (/^https?:\/\//i.test(filePath)) {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`تعذر تنزيل الملف المرفوع (HTTP ${response.status})`);
        }
        return Buffer.from(await response.arrayBuffer());
    }
    return fs.promises.readFile(filePath);
}

async function extractTextFromUploadedFile(file) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!['.pdf', '.docx'].includes(ext)) {
        throw new Error('صيغة ملف الأسئلة غير مدعومة، يرجى رفع ملف PDF أو DOCX');
    }

    const dataBuffer = await readUploadedFile(file.path);
    if (ext === '.pdf') {
        const parser = new PDFParse({ data: dataBuffer });
        try {
            const pdfData = await parser.getText();
            return pdfData.text || '';
        } finally {
            await parser.destroy();
        }
    }

    const docData = await mammoth.extractRawText({ buffer: dataBuffer });
    return docData.value || '';
}

// Helpers for Parsing
function splitInlineOptions(line) {
    const markerRegex = /(?:^|\s+)(?:\(|\[)?([a-d]|[A-D]|[أبجد]|[اإآ])(?:\)|\]|[\.\-\):：])+\s+/g;
    let markers = [];
    let match;
    while ((match = markerRegex.exec(line)) !== null) {
        markers.push({
            letter: match[1].toLowerCase(),
            index: match.index,
            fullMatchLength: match[0].length
        });
    }
    if (markers.length <= 1) {
        return null;
    }
    const options = [];
    for (let i = 0; i < markers.length; i++) {
        const current = markers[i];
        const next = markers[i + 1];
        const startTextIndex = current.index + current.fullMatchLength;
        const endTextIndex = next ? next.index : line.length;
        const optionText = line.substring(startTextIndex, endTextIndex).trim();
        options.push(optionText);
    }
    return options;
}

function normalizeArabicNumerals(value) {
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    return String(value || '').replace(/[٠-٩]/g, digit => String(arabicDigits.indexOf(digit)));
}

function parseExamText(text) {
    const lines = text.split('\n').map(l => normalizeArabicNumerals(l).trim()).filter(l => l.length > 0);
    const questions = [];
    let currentQuestion = null;
    let expectedQNum = 1;

    const optionStartRegex = /^(?:\(|\[)?([أبجدa-d]|[اإآأ])(?:\)|\]|[\.\-\):：])+\s*(.*)$/i;
    const optionEndRegex = /^(.*?)\s*(?:(?:[\.\-\):：])+\s*([أبجد]|[اإآأ])|([أبجد]|[اإآأ])\s*(?:[\.\-\):：])+)/;
    const answerRegex = /^(?:الإجابة|الحل|correct(?:\s*answer)?)\s*[:：\-]\s*(.*)$/i;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('--') && (line.includes('of') || line.includes('page') || /\d+\s+of\s+\d+/.test(line))) {
            continue;
        }

        let qNum = null;
        let qText = null;
        let forceType = null;

        const typeMatch = line.match(/^(?:\[(مقالي|اختياري|صح وخطأ)\])\s*(.*)$/i);
        let cleanLine = line;
        if (typeMatch) {
            forceType = typeMatch[1];
            cleanLine = typeMatch[2].trim();
        }

        const startNumMatch = cleanLine.match(/^(\d+)(?:[\.\-\):：]|\s+)\s*(.*)$/);
        if (startNumMatch) {
            const num = parseInt(startNumMatch[1]);
            if (num === expectedQNum || num === expectedQNum + 1 || (num > 0 && num <= 100 && Math.abs(num - expectedQNum) <= 2)) {
                qNum = num;
                qText = startNumMatch[2].trim();
            }
        }

        if (qNum === null) {
            const endNumMatch = cleanLine.match(/^(.*?)\s*\b(\d+)$/);
            if (endNumMatch) {
                const num = parseInt(endNumMatch[2]);
                if (num === expectedQNum || num === expectedQNum + 1 || (num > 0 && num <= 100 && Math.abs(num - expectedQNum) <= 2)) {
                    qNum = num;
                    qText = endNumMatch[1].trim();
                }
            }
        }

        if (qNum !== null && qText && qText.length > 5) {
            if (currentQuestion) {
                if (!currentQuestion.type) {
                    if (currentQuestion.options.length > 0) {
                        currentQuestion.type = currentQuestion.options.length === 2 &&
                            (currentQuestion.options[0].includes('صح') || currentQuestion.options[0].includes('خطأ')) ? 'truefalse' : 'mcq';
                    } else {
                        currentQuestion.type = 'essay';
                    }
                }
                questions.push(currentQuestion);
            }

            let type = 'mcq';
            if (forceType === 'مقالي') type = 'essay';
            else if (forceType === 'صح وخطأ') type = 'truefalse';

            currentQuestion = {
                text: qText,
                options: [],
                correctAnswer: '',
                type: forceType ? type : null
            };
            expectedQNum = qNum + 1;
            continue;
        }

        if (currentQuestion) {
            const ansMatch = line.match(answerRegex);
            const inlineOpts = splitInlineOptions(line);
            const optStartMatch = line.match(optionStartRegex);
            const optEndMatch = line.match(optionEndRegex);

            if (ansMatch) {
                currentQuestion.correctAnswer = ansMatch[1].trim();
            } else if (inlineOpts) {
                currentQuestion.options.push(...inlineOpts);
            } else if (optStartMatch) {
                currentQuestion.options.push(optStartMatch[2].trim());
            } else if (optEndMatch) {
                currentQuestion.options.push(optEndMatch[1].trim());
            } else {
                if (currentQuestion.options.length === 0 && !currentQuestion.correctAnswer) {
                    currentQuestion.text += ' ' + line;
                } else if (currentQuestion.options.length > 0 && !currentQuestion.correctAnswer) {
                    currentQuestion.options[currentQuestion.options.length - 1] += ' ' + line;
                }
            }
        }
    }

    if (currentQuestion) {
        if (!currentQuestion.type) {
            if (currentQuestion.options.length > 0) {
                currentQuestion.type = currentQuestion.options.length === 2 &&
                    (currentQuestion.options[0].includes('صح') || currentQuestion.options[0].includes('خطأ')) ? 'truefalse' : 'mcq';
            } else {
                currentQuestion.type = 'essay';
            }
        }
        questions.push(currentQuestion);
    }

    return questions;
}

function cleanAnswerValue(ansVal) {
    if (!ansVal) return '';
    let val = ansVal.trim();
    val = val.replace(/^["'\(（\[]+|["'\)）\]]+$/g, '').trim();
    val = val.replace(/^(الإجابة|الحل|الإجابة هي|الحل هو|الجواب|الجواب هو|correct answer is|correct answer|answer is|answer)\s*[:：\-]?\s*/i, '').trim();
    val = val.replace(/^["'\(（\[]+|["'\)）\]]+$/g, '').trim();
    return val;
}

function parseAnswersText(text) {
    const lines = text.split('\n').map(l => normalizeArabicNumerals(l).trim()).filter(l => l.length > 0);
    const answers = [];
    lines.forEach(line => {
        const parts = line.split(/(?=\b\d+[\.\-\)])/);
        parts.forEach(part => {
            const trimmedPart = part.trim();
            if (!trimmedPart) return;
            const match = trimmedPart.match(/^(?:\(|\[)?(\d+)(?:\)|\]|[\.\-\):：])\s*(.*)$/);
            if (match) {
                answers.push({
                    index: parseInt(match[1]) - 1,
                    val: match[2].trim()
                });
            } else {
                answers.push({
                    index: answers.length,
                    val: trimmedPart
                });
            }
        });
    });
    return answers;
}

// Controller Actions
exports.getStudentResults = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const exams = await Exam.find({ "results.studentId": studentId }).select('title subject teacherName totalMarks results');
        const studentResults = [];
        exams.forEach(exam => {
            const result = exam.results.find(r => r.studentId === studentId);
            if (result) {
                studentResults.push({
                    examId: exam._id,
                    examTitle: exam.title,
                    subject: exam.subject,
                    teacherName: exam.teacherName,
                    score: result.score,
                    totalMarks: exam.totalMarks,
                    percentage: result.percentage,
                    isGraded: result.isGraded,
                    submittedAt: result.submittedAt
                });
            }
        });
        res.json({ success: true, results: studentResults });
    } catch (err) {
        next(err);
    }
};

exports.getAllExams = async (req, res, next) => {
    try {
        const { grade, teacherId, studentId } = req.query;
        let filter = { isActive: true };
        if (grade) filter.grades = grade;
        if (teacherId) filter.teacherId = teacherId;

        const exams = await Exam.find(filter).sort({ createdAt: -1 });

        const mappedExams = exams.map(exam => {
            const examObj = exam.toObject();
            if (studentId) {
                const studentResult = exam.results.find(r => r.studentId === studentId);
                examObj.results = studentResult ? [studentResult] : [];
            } else {
                delete examObj.results;
            }
            return examObj;
        });

        res.json({ success: true, exams: mappedExams });
    } catch (err) {
        next(err);
    }
};

exports.resetStudentExam = async (req, res, next) => {
    try {
        const { examId, studentId } = req.params;
        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ success: false, message: 'الامتحان غير موجود' });

        exam.results = exam.results.filter(r => r.studentId !== studentId);
        await exam.save();

        res.json({ success: true, message: 'تم إعادة تعيين محاولة الطالب بنجاح' });
    } catch (err) {
        next(err);
    }
};

exports.getAllExamsForAdmin = async (req, res, next) => {
    try {
        const exams = await Exam.find().sort({ createdAt: -1 });
        res.json({ success: true, exams });
    } catch (err) {
        next(err);
    }
};

exports.getExamById = async (req, res, next) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ success: false, message: 'الامتحان غير موجود' });
        res.json({ success: true, exam });
    } catch (err) {
        next(err);
    }
};

exports.createExam = async (req, res, next) => {
    try {
        const { title, description, teacherId, teacherName, subject, grades, duration, totalMarks, questions } = req.body;
        if (!title || !questions || questions.length === 0) {
            return res.status(400).json({ success: false, message: 'العنوان والأسئلة مطلوبة' });
        }
        const exam = new Exam({ title, description, teacherId, teacherName, subject, grades, duration, totalMarks: totalMarks || questions.length, questions });
        await exam.save();
        res.status(201).json({ success: true, exam });
    } catch (err) {
        next(err);
    }
};

exports.updateExam = async (req, res, next) => {
    try {
        const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!exam) return res.status(404).json({ success: false, message: 'الامتحان غير موجود' });
        res.json({ success: true, exam });
    } catch (err) {
        next(err);
    }
};

exports.deleteExam = async (req, res, next) => {
    try {
        await Exam.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};

exports.submitExam = async (req, res, next) => {
    try {
        const { studentId, studentName, studentPhone, answers } = req.body;
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ success: false, message: 'الامتحان غير موجود' });

        const alreadyDone = exam.results.find(r => r.studentId === studentId);
        if (alreadyDone) {
            return res.status(400).json({ success: false, message: 'لقد أرسلت هذا الامتحان مسبقاً', result: alreadyDone });
        }

        let score = 0;
        const hasEssays = exam.questions.some(q => q.type === 'essay');
        const isGraded = !hasEssays;
        const essayScores = [];

        const corrected = exam.questions.map((q, i) => {
            const studentAns = (answers[i] || '').toString().trim();
            let isCorrect = false;
            let isEssay = q.type === 'essay';

            if (isEssay) {
                essayScores.push({ questionIndex: i, score: 0 });
            } else {
                isCorrect = studentAns === q.correctAnswer.toString().trim();
                if (isCorrect) score++;
            }

            return {
                question: q.text,
                options: q.options,
                studentAnswer: studentAns,
                correctAnswer: q.correctAnswer,
                isCorrect,
                isEssay
            };
        });

        const percentage = Math.round((score / exam.totalMarks) * 100);
        const result = {
            studentId,
            studentName,
            studentPhone,
            score,
            percentage,
            answers,
            essayScores,
            isGraded,
            submittedAt: new Date()
        };

        exam.results.push(result);
        await exam.save();

        res.json({ success: true, score, percentage, totalMarks: exam.totalMarks, corrected, isGraded });
    } catch (err) {
        next(err);
    }
};

exports.gradeEssay = async (req, res, next) => {
    try {
        const { studentId, grades } = req.body;
        const exam = await Exam.findById(req.params.examId);
        if (!exam) return res.status(404).json({ success: false, message: 'الامتحان غير موجود' });

        const resultIndex = exam.results.findIndex(r => r.studentId === studentId);
        if (resultIndex === -1) return res.status(404).json({ success: false, message: 'نتيجة الطالب غير موجودة' });

        const result = exam.results[resultIndex];
        let essayScoreSum = 0;
        result.essayScores = [];

        exam.questions.forEach((q, i) => {
            if (q.type === 'essay') {
                const givenScore = parseFloat(grades[i]) || 0;
                result.essayScores.push({ questionIndex: i, score: givenScore });
                essayScoreSum += givenScore;
            }
        });

        let mcqScore = 0;
        exam.questions.forEach((q, i) => {
            if (q.type !== 'essay') {
                const studentAns = (result.answers[i] || '').toString().trim();
                const isCorrect = studentAns === q.correctAnswer.toString().trim();
                if (isCorrect) mcqScore++;
            }
        });

        result.score = mcqScore + essayScoreSum;
        result.percentage = Math.round((result.score / exam.totalMarks) * 100);
        result.isGraded = true;

        exam.markModified('results');
        await exam.save();

        res.json({ success: true, result });
    } catch (err) {
        next(err);
    }
};

exports.uploadFile = async (req, res, next) => {
    try {
        const files = req.files;
        if (!files || !files['examFile']) {
            return res.status(400).json({ success: false, message: 'لم يتم رفع ملف الأسئلة الرئيسي' });
        }

        const examFile = files['examFile'][0];
        const text = await extractTextFromUploadedFile(examFile);

        const questions = parseExamText(text);
        if (!questions.length) {
            return res.status(422).json({
                success: false,
                message: 'تمت قراءة الملف، لكن لم نتعرّف على أسئلة مرقمة. تأكد أن الملف ليس صورة ممسوحة ضوئياً وأن الأسئلة تبدأ بـ 1. أو ١.، أو استخدم إدخال النص المباشر.'
            });
        }

        if (files['answerFile']) {
            const answerFile = files['answerFile'][0];
            const ansText = await extractTextFromUploadedFile(answerFile);

            const correctAnswers = parseAnswersText(ansText);

            if (correctAnswers.length > 0) {
                questions.forEach((q, i) => {
                    const matchedAns = correctAnswers.find(a => a.index === i) || correctAnswers[i];
                    if (matchedAns) {
                        let ansVal = cleanAnswerValue(matchedAns.val);
                        if (q.type === 'mcq') {
                            let matchedIdx = -1;
                            const normalizedVal = ansVal.toLowerCase().replace(/[إأآا]/g, 'ا').trim();

                            if (normalizedVal === 'ا' || normalizedVal === 'a' || normalizedVal === '1' || normalizedVal === '0') matchedIdx = 0;
                            else if (normalizedVal === 'ب' || normalizedVal === 'b' || normalizedVal === '2' || normalizedVal === '1') matchedIdx = 1;
                            else if (normalizedVal === 'ج' || normalizedVal === 'c' || normalizedVal === '3' || normalizedVal === '2') matchedIdx = 2;
                            else if (normalizedVal === 'د' || normalizedVal === 'd' || normalizedVal === '4' || normalizedVal === '3') matchedIdx = 3;

                            if (matchedIdx === -1 && q.options && q.options.length > 0) {
                                matchedIdx = q.options.findIndex(opt => {
                                    const optNorm = opt.toLowerCase().replace(/[إأآا]/g, 'ا').trim();
                                    return optNorm === normalizedVal || optNorm.includes(normalizedVal) || normalizedVal.includes(optNorm);
                                });
                            }

                            if (matchedIdx !== -1) {
                                q.correctAnswer = matchedIdx.toString();
                            } else {
                                q.correctAnswer = ansVal;
                            }
                        } else if (q.type === 'truefalse') {
                            const normalizedVal = ansVal.toLowerCase().trim();
                            if (normalizedVal.includes('صح') || normalizedVal.includes('صواب') || normalizedVal === 'true' || normalizedVal === '1' || normalizedVal === 'yes' || normalizedVal === 'نعم') {
                                q.correctAnswer = 'true';
                            } else if (normalizedVal.includes('خطأ') || normalizedVal.includes('خاطئ') || normalizedVal === 'false' || normalizedVal === '0' || normalizedVal === 'no' || normalizedVal === 'لا') {
                                q.correctAnswer = 'false';
                            } else {
                                q.correctAnswer = ansVal;
                            }
                        } else {
                            q.correctAnswer = ansVal;
                        }
                    }
                });
            }
        }

        res.json({ success: true, questions });
    } catch (err) {
        next(err);
    }
};

exports.getExamResults = async (req, res, next) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ success: false, message: 'الامتحان غير موجود' });
        res.json({ success: true, results: exam.results, examTitle: exam.title });
    } catch (err) {
        next(err);
    }
};
