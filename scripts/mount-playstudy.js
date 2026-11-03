const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

if (!serverJs.includes('playStudyRoutes')) {
    serverJs = serverJs.replace(
        "const teacherApplicationRoutes = require('./routes/teacherApplication.routes');",
        "const teacherApplicationRoutes = require('./routes/teacherApplication.routes');\nconst playStudyRoutes = require('./routes/playStudy.routes');"
    );

    serverJs = serverJs.replace(
        "app.use('/api/teacher-applications', teacherApplicationRoutes);",
        "app.use('/api/teacher-applications', teacherApplicationRoutes);\napp.use('/api/play-study', playStudyRoutes);"
    );

    fs.writeFileSync('server.js', serverJs, 'utf8');
    console.log('✅ Mounted /api/play-study routes in server.js');
} else {
    console.log('ℹ️ playStudyRoutes already mounted in server.js');
}

