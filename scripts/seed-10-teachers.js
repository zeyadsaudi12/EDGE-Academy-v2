require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const Teacher = require('../models/teacher.model');
const Course = require('../models/course.model');
const Video = require('../models/video.model');
const User = require('../models/user.model');

const BANNER_URL = 'https://res.cloudinary.com/bkf1zked/image/upload/v1793415871/edge-academy/edge_brand_banner_1793415870999.jpg';
const SQUARE_URL = 'https://res.cloudinary.com/bkf1zked/image/upload/v1793415871/edge-academy/edge_brand_square_1793415872295.jpg';

const TEACHERS_DATA = [
    {
        name: 'أ. أحمد فتحي',
        subjectAr: 'اللغة العربية',
        bio: 'خبير ومعد المنهج في اللغة العربية للثانوية العامة والشهادات الإعدادية، خبرة أكثر من 15 عاماً في تبسيط النحو والبلاغة والنصوص والأدب وفق أحدث معايير الامتحانات.',
        studentsCount: 340,
        rating: 5,
        grades: ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'],
        schedule: [
            { center: 'سنتر الأوائل - الدقي', day: 'السبت', grade: 'الصف الثالث الثانوي', time: '10:00 ص' },
            { center: 'سنتر التميز - مدينة نصر', day: 'الثلاثاء', grade: 'الصف الثاني الثانوي', time: '02:00 م' }
        ],
        courses: [
            {
                title: 'المراجعة الشاملة للنحو والبلاغة - الصف الثالث الثانوي',
                description: 'كورس تدريبي مكثف يغطي كافة وحدات النحو السبعة وفنون البلاغة مع حل بنك أسئلة الوزارة ونماذج الامتحانات.',
                price: 250,
                grades: ['الصف الثالث الثانوي'],
                videos: [
                    {
                        title: 'المحاضرة 1: مراجعة الوحدة الأولى في النحو (همزة الوصل والقطع وأل الشمسية والقمرية)',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'النحو والبلاغة'
                    },
                    {
                        title: 'المحاضرة 2: أسرار علم البلاغة من التشبيه والاستعارة إلى الكناية والمجاز',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'النحو والبلاغة'
                    },
                    {
                        title: 'المحاضرة 3: ورشة حل تدريبات متقدمة ونماذج امتحانات وزارية',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'النحو والبلاغة'
                    }
                ]
            },
            {
                title: 'شرح منهج اللغة العربية - الصف الثاني الثانوي',
                description: 'شرح مبسط لدروس النحو والأدب والبلاغة والقراءة المتحررة لطلاب الصف الثاني الثانوي.',
                price: 200,
                grades: ['الصف الثاني الثانوي'],
                videos: [
                    {
                        title: 'المحاضرة 1: إعراب الفعل المضارع وبناء الأفعال وحالات جزم المضارع',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'شرح المنهج'
                    },
                    {
                        title: 'المحاضرة 2: الأدب في العصر الجاهلي والمعلقات ونصوص مختارة',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'شرح المنهج'
                    }
                ]
            }
        ]
    },
    {
        name: 'مستر محمد عبد العزيز',
        subjectAr: 'اللغة الإنجليزية',
        bio: 'كبير معلمي اللغة الإنجليزية، خبير تدريب الطلاب على النظام الحديث والدرجات النهائية واحتراف مهارات Writing & Comprehension وحل أسئلة التابلت.',
        studentsCount: 420,
        rating: 5,
        grades: ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'],
        schedule: [
            { center: 'سنتر الأهرام - المعادي', day: 'الأحد', grade: 'الصف الثالث الثانوي', time: '11:00 ص' },
            { center: 'سنتر النخبة - شبرا', day: 'الأربعاء', grade: 'الصف الأول الثانوي', time: '04:00 م' }
        ],
        courses: [
            {
                title: 'English Masterclass - الصف الثالث الثانوي',
                description: 'كورس احترافي للغة الإنجليزية يشمل شرح الجرامر بالتفصيل، وحفظ الكلمات عبر السياق، مع تدريب مكثف على المقال والترجمة.',
                price: 280,
                grades: ['الصف الثالث الثانوي'],
                videos: [
                    {
                        title: 'Lecture 1: Unit 1 Past Tenses & Vocabulary in Context',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'English Curriculum'
                    },
                    {
                        title: 'Lecture 2: Advanced Essay Writing & Reading Skills',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'English Curriculum'
                    },
                    {
                        title: 'Lecture 3: Comprehensive Exam Practice & Trick Questions',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'English Curriculum'
                    }
                ]
            },
            {
                title: 'General English & Grammar - الصف الأول الثانوي',
                description: 'تأسيس متين لطلاب الصف الأول الثانوي في قواعد اللغة الإنجليزية والمفردات اللغوية.',
                price: 180,
                grades: ['الصف الأول الثانوي'],
                videos: [
                    {
                        title: 'Lecture 1: Present Simple & Continuous Revision and Usage',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'Grade 10 English'
                    },
                    {
                        title: 'Lecture 2: Translation Techniques and Vocabulary Booster',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'Grade 10 English'
                    }
                ]
            }
        ]
    },
    {
        name: 'أ. خالد مصطفى',
        subjectAr: 'الرياضيات',
        bio: 'أستاذ الرياضيات البحتة والتطبيقية، تبسيط التفاضل والتكامل والاستاتيكا والديناميكا بأساليب التفكير الهندسي والحلول النموذجية السريعة.',
        studentsCount: 390,
        rating: 5,
        grades: ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'],
        schedule: [
            { center: 'سنتر فيكتوريا - مصر الجديدة', day: 'الإثنين', grade: 'الصف الثالث الثانوي', time: '09:00 ص' },
            { center: 'سنتر القمة - المهندسين', day: 'الخميس', grade: 'الصف الثاني الثانوي', time: '01:00 م' }
        ],
        courses: [
            {
                title: 'التفاضل والتكامل من الصفر حتى الاحتراف - الصف الثالث الثانوي',
                description: 'شرح متعمق لجميع قواعد الاشتقاق والتكامل وتطبيقات القيم العظمى والصغرى وحجوم الأجسام الدورانية.',
                price: 260,
                grades: ['الصف الثالث الثانوي'],
                videos: [
                    {
                        title: 'المحاضرة 1: اشتقاق الدوال المثلثية وتطبيقات السلسلة',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'التفاضل والتكامل'
                    },
                    {
                        title: 'المحاضرة 2: المشتقات العليا ومعادلات المماس والعمودي للمنحنيات',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'التفاضل والتكامل'
                    },
                    {
                        title: 'المحاضرة 3: حل بنك أسئلة الوزارة والمسائل الأكثر تكراراً',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'التفاضل والتكامل'
                    }
                ]
            },
            {
                title: 'الجبر وحساب المثلثات - الصف الأول الثانوي',
                description: 'كورس تأسيسي في المصفوفات والمحددات وحساب المثلثات والزوايا المنتسبة.',
                price: 180,
                grades: ['الصف الأول الثانوي'],
                videos: [
                    {
                        title: 'المحاضرة 1: تنظيم البيانات في مصفوفات والعمليات الجبرية عليها',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'جبر ومثلثات'
                    },
                    {
                        title: 'المحاضرة 2: المتطابقات المثلثية وحل المعادلات المثلثية بسهولة',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'جبر ومثلثات'
                    }
                ]
            }
        ]
    },
    {
        name: 'د. عماد الدين سليم',
        subjectAr: 'الفيزياء',
        bio: 'دكتوراه في الفيزياء النظرية، خبير تدريس فيزياء الثانوية العامة، ربط قوانين الكهربية والفيزياء الحديثة بتجارب بصرية وتفكير علمي مبتكر.',
        studentsCount: 510,
        rating: 5,
        grades: ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'],
        schedule: [
            { center: 'سنتر المستقبل - الهرم', day: 'السبت', grade: 'الصف الثالث الثانوي', time: '01:00 م' },
            { center: 'سنتر الإبداع - التجمع الخامس', day: 'الثلاثاء', grade: 'الصف الأول الثانوي', time: '05:00 م' }
        ],
        courses: [
            {
                title: 'الفيزياء الكهربية والحديثة - الصف الثالث الثانوي',
                description: 'الكورس الشامل لفيزياء الثانوية العامة مع التركيز على فهم الرسوم البيانية وفك ألغاز الدوائر الكهربية المعقدة.',
                price: 300,
                grades: ['الصف الثالث الثانوي'],
                videos: [
                    {
                        title: 'المحاضرة 1: التيار الكهربي وقانون أوم وتوصيل المقاومات توالي وتوازي',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'الفيزياء الكهربية'
                    },
                    {
                        title: 'المحاضرة 2: قانونا كيرشوف وحل أصعب الدوائر الكهربية خطوة بخطوة',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'الفيزياء الكهربية'
                    },
                    {
                        title: 'المحاضرة 3: التأثير المغناطيسي للتيار الكهربي وأجهزة القياس التناظرية',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'الفيزياء الكهربية'
                    }
                ]
            },
            {
                title: 'الحركة الدائرية وقوانين نيوتن - الصف الأول الثانوي',
                description: 'شرح مبسط لقوانين الحركة والجاذبية الكونية والتطبيقات الحياتية للفيزياء.',
                price: 190,
                grades: ['الصف الأول الثانوي'],
                videos: [
                    {
                        title: 'المحاضرة 1: كمية التحرك وتطبيقات قانون نيوتن الثاني',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'فيزياء أولى ثانوي'
                    },
                    {
                        title: 'المحاضرة 2: العجلة المركزية وقوة الجذب المركزية وحركة الأقمار الصناعية',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'فيزياء أولى ثانوي'
                    }
                ]
            }
        ]
    },
    {
        name: 'د. شريف حمدي',
        subjectAr: 'الكيمياء',
        bio: 'أستاذ الكيمياء ومسؤول التطوير التعليمي، خبير الكيمياء العضوية وغير العضوية وبنك المعرفة المصري، أسلوب تفاعلي ممتع لحفظ وفهم المعادلات والتجارب.',
        studentsCount: 450,
        rating: 5,
        grades: ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'],
        schedule: [
            { center: 'سنتر رواد النجاح - الدقي', day: 'الأحد', grade: 'الصف الثالث الثانوي', time: '02:00 م' },
            { center: 'سنتر المنارة - حدائق الأهرام', day: 'الأربعاء', grade: 'الصف الثاني الثانوي', time: '06:00 م' }
        ],
        courses: [
            {
                title: 'أسرار الكيمياء العضوية وغير العضوية - الصف الثالث الثانوي',
                description: 'الكورس الذهبي لإتقان العناصر الانتقالية والتحليل الكيميائي والاتزان والكيمياء الكهربية والعضوية.',
                price: 290,
                grades: ['الصف الثالث الثانوي'],
                videos: [
                    {
                        title: 'المحاضرة 1: العناصر الانتقالية والخواص الكيميائية للسلسلة الأولى',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'منهج الكيمياء'
                    },
                    {
                        title: 'المحاضرة 2: التحليل الكيميائي الوصفي وتجارب الكشف عن الكاتيونات والأنيونات',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'منهج الكيمياء'
                    },
                    {
                        title: 'المحاضرة 3: مقدمة الكيمياء العضوية وتسمية الألكانات والألكينات بنظام الأيوباك',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'منهج الكيمياء'
                    }
                ]
            },
            {
                title: 'أساسيات الكيمياء والروابط الجزيئية - الصف الثاني الثانوي',
                description: 'شرح لنظريات بنية الذرة والجدول الدوري وتدرج الخواص وأنواع الروابط الكيميائية.',
                price: 200,
                grades: ['الصف الثاني الثانوي'],
                videos: [
                    {
                        title: 'المحاضرة 1: تطور مفهوم بنية الذرة من دالتون إلى نظرية بور الحديثة',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'كيمياء ثانية ثانوي'
                    },
                    {
                        title: 'المحاضرة 2: أعداد الكم وقواعد توزيع الإلكترونات في المستويات الفرعية',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'كيمياء ثانية ثانوي'
                    }
                ]
            }
        ]
    },
    {
        name: 'د. ياسر عبد الرحمن',
        subjectAr: 'الأحياء',
        bio: 'دكتور ومحاضر مادة الأحياء، متخصص في علم الوراثة والمناعة والبيولوجيا الجزيئية (DNA & RNA)، يعتمد على الفيديوهات ثلاثية الأبعاد والمحاكاة الحية.',
        studentsCount: 480,
        rating: 5,
        grades: ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'],
        schedule: [
            { center: 'سنتر الفاتح - حلوان', day: 'الإثنين', grade: 'الصف الثالث الثانوي', time: '11:00 ص' },
            { center: 'سنتر الأوائل - الزيتون', day: 'الخميس', grade: 'الصف الأول الثانوي', time: '03:00 م' }
        ],
        courses: [
            {
                title: 'شرح البيولوجيا الجزيئية والمناعة - الصف الثالث الثانوي',
                description: 'تغطية شاملة لفصول الدعامة والحركة والتنسيق الهرموني والتكاثر والمناعة والـ DNA بأسلوب الربط والتحليل.',
                price: 270,
                grades: ['الصف الثالث الثانوي'],
                videos: [
                    {
                        title: 'المحاضرة 1: الدعامة في النبات وفي الإنسان (الهيكل العظمي والمفاصل)',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'أحياء ثانوية عامة'
                    },
                    {
                        title: 'المحاضرة 2: آلية انقباض العضلات والتشابك العصبي العضلي',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'أحياء ثانوية عامة'
                    },
                    {
                        title: 'المحاضرة 3: تركيب الجهاز المناعي وأنواع خلايا الدم البيضاء والأجسام المضادة',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'أحياء ثانوية عامة'
                    }
                ]
            },
            {
                title: 'التغذية والهضم في الكائنات الحية - الصف الثاني الثانوي',
                description: 'شرح تفصيلي لعمليات البناء الضوئي والتنفس الخلوي والهضم والنقل في النبات والحيوان.',
                price: 190,
                grades: ['الصف الثاني الثانوي'],
                videos: [
                    {
                        title: 'المحاضرة 1: التغذية الذاتية وتركيب الورقة وآلية البناء الضوئي',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'أحياء ثانية ثانوي'
                    },
                    {
                        title: 'المحاضرة 2: الجهاز الهضمي ودور الإنزيمات في هضم وامتصاص الغذاء',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'أحياء ثانية ثانوي'
                    }
                ]
            }
        ]
    },
    {
        name: 'أ. هيثم الشناوي',
        subjectAr: 'الجيولوجيا',
        bio: 'كبير معلمي الجيولوجيا والعلوم البيئية لشهادة الثانوية العامة، خبرة 14 عاماً في قراءة القطاعات الجيولوجية وحركات الألواح التكتونية والمعادن والصخور.',
        studentsCount: 310,
        rating: 5,
        grades: ['الصف الثالث الثانوي'],
        schedule: [
            { center: 'سنتر الصفوة - عين شمس', day: 'السبت', grade: 'الصف الثالث الثانوي', time: '04:00 م' },
            { center: 'سنتر النور - جسر السويس', day: 'الثلاثاء', grade: 'الصف الثالث الثانوي', time: '11:00 ص' }
        ],
        courses: [
            {
                title: 'الجيولوجيا والعلوم البيئية للثانوية العامة',
                description: 'دورة شاملة لشرح منهج الجيولوجيا من نشأة الأرض حتى النظام البيئي والموارد البيئية واستنزافها.',
                price: 240,
                grades: ['الصف الثالث الثانوي'],
                videos: [
                    {
                        title: 'المحاضرة 1: كوكب الأرض ومكوناته والتركيب الداخلي للقشرة والوشاح واللب',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'منهج الجيولوجيا'
                    },
                    {
                        title: 'المحاضرة 2: التراكيب الجيولوجية الأولية والثانوية (الطيات والفوالق والفواصل)',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'منهج الجيولوجيا'
                    },
                    {
                        title: 'المحاضرة 3: علم المعادن والخواص البصرية والتماسكية وصلادة موهس',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'منهج الجيولوجيا'
                    }
                ]
            }
        ]
    },
    {
        name: 'أ. طارق عبد الحميد',
        subjectAr: 'التاريخ',
        bio: 'مؤرخ ومعلم أول التاريخ للثانوية العامة، أسلوب درامي شيق وممتع في ربط الحوادث التاريخية وتحليل أسباب ونتائج الثورات والحروب وصناعة القرار.',
        studentsCount: 360,
        rating: 5,
        grades: ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'],
        schedule: [
            { center: 'سنتر المجد - المطرية', day: 'الأحد', grade: 'الصف الثالث الثانوي', time: '09:00 ص' },
            { center: 'سنتر الإيمان - شبرا الخيمة', day: 'الأربعاء', grade: 'الصف الأول الثانوي', time: '01:00 م' }
        ],
        courses: [
            {
                title: 'التاريخ الحديث والمعاصر - الصف الثالث الثانوي',
                description: 'رحلة تفصيلية عبر تاريخ مصر من الحملة الفرنسية وبناء الدولة الحديثة حتى ثورات 1919 و 1952 والقضية الفلسطينية.',
                price: 220,
                grades: ['الصف الثالث الثانوي'],
                videos: [
                    {
                        title: 'المحاضرة 1: الحملة الفرنسية على مصر والشام والمقاومة الشعبية',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'تاريخ الثانوية العامة'
                    },
                    {
                        title: 'المحاضرة 2: بناء الدولة الحديثة في عهد محمد علي باشا (الاحتكار والنهضة التعليمية)',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'تاريخ الثانوية العامة'
                    },
                    {
                        title: 'المحاضرة 3: الثورة العرابية والتدخل الأجنبي واحتلال بريطانيا لمصر 1882',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'تاريخ الثانوية العامة'
                    }
                ]
            },
            {
                title: 'حضارة مصر القديمة وحضارات الشرق - الصف الأول الثانوي',
                description: 'مدخل إلى دراسة التاريخ القديم وعوامل قيام الحضارة الفرعونية وحضارات بلاد الرافدين وفينيقيا.',
                price: 170,
                grades: ['الصف الأول الثانوي'],
                videos: [
                    {
                        title: 'المحاضرة 1: ملامح من تاريخ مصر القديمة وعصور القوة والاضمحلال',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'تاريخ أولى ثانوي'
                    },
                    {
                        title: 'المحاضرة 2: الحياة الاقتصادية والاجتماعية عند القدماء المصريين',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'تاريخ أولى ثانوي'
                    }
                ]
            }
        ]
    },
    {
        name: 'أ. وليد زكي',
        subjectAr: 'الجغرافيا',
        bio: 'خبير الجغرافيا السياسية والتنمية الاقتصادية، تدريب مكثف على قراءة وتحليل الخرائط الجيوسياسية والأحلاف والتكتلات الاقتصادية العالمية.',
        studentsCount: 320,
        rating: 5,
        grades: ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'],
        schedule: [
            { center: 'سنتر النجوم - فيصل', day: 'الإثنين', grade: 'الصف الثالث الثانوي', time: '01:00 م' },
            { center: 'سنتر السلام - العباسية', day: 'الخميس', grade: 'الصف الأول الثانوي', time: '10:00 ص' }
        ],
        courses: [
            {
                title: 'الجغرافيا السياسية - الصف الثالث الثانوي',
                description: 'الكورس الكامل في الجغرافيا السياسية يشمل الدولة والمقومات الطبيعية والبشرية والأحلاف العسكرية والنظام العالمي الجديد.',
                price: 220,
                grades: ['الصف الثالث الثانوي'],
                videos: [
                    {
                        title: 'المحاضرة 1: مدخل لدراسة الجغرافيا السياسية ومفهوم الدولة والأمة',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'الجغرافيا السياسية'
                    },
                    {
                        title: 'المحاضرة 2: المقومات الطبيعية لقوة الدولة (الموقع والمساحة والتضاريس والمناخ)',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'الجغرافيا السياسية'
                    },
                    {
                        title: 'المحاضرة 3: المقومات البشرية والتنظيمية لقوة الدولة وتحليل الخرائط',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'الجغرافيا السياسية'
                    }
                ]
            },
            {
                title: 'موقع مصر وأهميته الجغرافية - الصف الأول الثانوي',
                description: 'دراسة موقع مصر الجغرافي والفلكي ومظاهر السطح والمناخ والنبات الطبيعي.',
                price: 160,
                grades: ['الصف الأول الثانوي'],
                videos: [
                    {
                        title: 'المحاضرة 1: موقع مصر وأهميته الاستراتيجية عبر العصور',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'جغرافيا أولى ثانوي'
                    },
                    {
                        title: 'المحاضرة 2: التكوينات الجيولوجية وعوامل تشكيل سطح الأرض في مصر',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'جغرافيا أولى ثانوي'
                    }
                ]
            }
        ]
    },
    {
        name: 'مسيو سيمون سامي',
        subjectAr: 'اللغة الفرنسية',
        bio: 'خبير اللغة الفرنسية بالمدارس التجريبية واللغات، تبسيط قواعد اللغة والمواقف اليومية وموضوعات التعبير للدرجة النهائية بنظام التابلت.',
        studentsCount: 290,
        rating: 5,
        grades: ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'],
        schedule: [
            { center: 'سنتر سان مارك - شبرا', day: 'الثلاثاء', grade: 'الصف الثالث الثانوي', time: '09:00 ص' },
            { center: 'سنتر الأمل - المعادي', day: 'الجمعة', grade: 'الصف الثاني الثانوي', time: '02:00 م' }
        ],
        courses: [
            {
                title: 'Le Club des Ados - الصف الثالث الثانوي',
                description: 'شرح متكامل لجميع وحدات منهج اللغة الفرنسية للثانوية العامة مع تدريبات مكثفة على المواقف والقواعد والموضوعات.',
                price: 230,
                grades: ['الصف الثالث الثانوي'],
                videos: [
                    {
                        title: 'Leçon 1: Le Club des Sportifs et l\'expression de l\'obligation',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'Français 3ème Année'
                    },
                    {
                        title: 'Leçon 2: Le Passé Composé et les Pronoms Personnels (COD / COI)',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'Français 3ème Année'
                    },
                    {
                        title: 'Leçon 3: Entraînement complet aux épreuves du baccalauréat',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'Français 3ème Année'
                    }
                ]
            },
            {
                title: 'Fondamentaux du Français - الصف الأول الثانوي',
                description: 'تأسيس شامل في الأبجدية، أدوات المعرفة والنكرة، والأفعال الأساسية للمبتدئين.',
                price: 160,
                grades: ['الصف الأول الثانوي'],
                videos: [
                    {
                        title: 'Leçon 1: Saluer, se présenter et présenter ses amis en français',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'Français 1ère Année'
                    },
                    {
                        title: 'Leçon 2: Les articles définis, indéfinis et le pluriel des noms',
                        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        price: null,
                        playlistName: 'Français 1ère Année'
                    }
                ]
            }
        ]
    }
];

async function seed() {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected successfully to MongoDB!');

        let addedTeachers = 0;
        let addedCourses = 0;
        let addedVideos = 0;

        for (const tData of TEACHERS_DATA) {
            // Check if teacher already exists by name
            let teacher = await Teacher.findOne({ name: tData.name });
            if (!teacher) {
                teacher = new Teacher({
                    name: tData.name,
                    subjectAr: tData.subjectAr,
                    bio: tData.bio,
                    studentsCount: tData.studentsCount,
                    rating: tData.rating,
                    imagePath: SQUARE_URL, // Setting the square Edge Academy branding for teacher avatar
                    grades: tData.grades,
                    schedule: tData.schedule,
                    hidden: false
                });
                await teacher.save();
                addedTeachers++;
                console.log(`👤 Teacher created: ${teacher.name} (${teacher.subjectAr})`);

                // Create assistant account like controller does
                let uniquePhone = '';
                let existingUser = null;
                do {
                    uniquePhone = '05' + Math.floor(100000000 + Math.random() * 900000000);
                    existingUser = await User.findOne({ phone: uniquePhone });
                } while (existingUser !== null);

                const randomPassword = crypto.randomBytes(4).toString('hex');
                const assistantUser = new User({
                    phone: uniquePhone,
                    password: randomPassword,
                    role: 'assistant',
                    teacherId: teacher._id,
                    firstName: 'مساعد ' + teacher.name,
                    lastName: 'التعليمي',
                    username: 'helper_' + uniquePhone,
                    nationalId: 'helper_' + uniquePhone,
                    grade: 'All',
                    governorate: 'الكل',
                    parentPhone: uniquePhone,
                    birthDate: new Date()
                });
                await assistantUser.save();
            } else {
                console.log(`ℹ️ Teacher already exists: ${teacher.name}`);
                // Ensure image is updated to the brand image if user requested
                teacher.imagePath = SQUARE_URL;
                await teacher.save();
            }

            // Create Courses for this teacher
            for (const cData of tData.courses) {
                let course = await Course.findOne({ title: cData.title, teacherId: String(teacher._id) });
                if (!course) {
                    course = new Course({
                        title: cData.title,
                        description: cData.description,
                        price: cData.price,
                        imagePath: BANNER_URL, // Setting the 16:9 banner Edge Academy branding for course card
                        grades: cData.grades,
                        teacherId: String(teacher._id),
                        hidden: false
                    });
                    await course.save();
                    addedCourses++;
                    console.log(`  📚 Course created: ${course.title}`);
                } else {
                    course.imagePath = BANNER_URL;
                    await course.save();
                }

                // Create Videos for this course
                for (const vData of cData.videos) {
                    let video = await Video.findOne({ title: vData.title, courseId: String(course._id) });
                    if (!video) {
                        video = new Video({
                            title: vData.title,
                            price: vData.price,
                            link: vData.link,
                            imagePath: BANNER_URL, // Setting the 16:9 banner Edge Academy branding for video thumbnail
                            videoPath: '',
                            grades: cData.grades,
                            teacherId: String(teacher._id),
                            courseId: String(course._id),
                            playlistName: vData.playlistName || 'شرح المنهج',
                            closed: false,
                            hidden: false,
                            releaseAfterDays: 0,
                            bookletFiles: [],
                            homeworkFiles: [],
                            likes: []
                        });
                        await video.save();
                        addedVideos++;
                        console.log(`    🎥 Video created: ${video.title}`);
                    } else {
                        video.imagePath = BANNER_URL;
                        await video.save();
                    }
                }
            }
        }

        console.log('\n=========================================');
        console.log(`🎉 Seeding completed successfully!`);
        console.log(`✅ Teachers added/verified: 10`);
        console.log(`✅ Courses newly added: ${addedCourses}`);
        console.log(`✅ Videos newly added: ${addedVideos}`);
        console.log(`✅ All images set to Edge Academy branding!`);
        console.log('=========================================\n');

        const totalTeachers = await Teacher.countDocuments();
        const totalCourses = await Course.countDocuments();
        const totalVideos = await Video.countDocuments();
        console.log(`📊 Current DB Totals -> Teachers: ${totalTeachers}, Courses: ${totalCourses}, Videos: ${totalVideos}`);

        await mongoose.disconnect();
        console.log('🔒 Disconnected from MongoDB.');
    } catch (err) {
        console.error('❌ Error seeding data:', err);
        process.exit(1);
    }
}

seed();

