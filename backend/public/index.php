<?php

// Allow CORS preflight requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Router;
use App\Core\Database;

// Load environment variables if available
if (file_exists(__DIR__ . '/../../.env')) {
    $lines = file(__DIR__ . '/../../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $name = trim($parts[0]);
            $value = trim($parts[1]);
            // Remove optional quotes
            $value = trim($value, '"\'');
            
            if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                putenv(sprintf('%s=%s', $name, $value));
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
}

// Connect to database
Database::connect();

$router = new Router();

// ======= TEMP DEBUG - REMOVE AFTER FIXING =======
if (isset($_GET['debug']) && $_GET['debug'] === 'uri') {
    header('Content-Type: application/json');
    echo json_encode([
        'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'N/A',
        'REDIRECT_URL' => $_SERVER['REDIRECT_URL'] ?? 'N/A',
        'PATH_INFO' => $_SERVER['PATH_INFO'] ?? 'N/A',
        'SCRIPT_NAME' => $_SERVER['SCRIPT_NAME'] ?? 'N/A',
        'PHP_SELF' => $_SERVER['PHP_SELF'] ?? 'N/A',
        'HTTP_HOST' => $_SERVER['HTTP_HOST'] ?? 'N/A',
        'QUERY_STRING' => $_SERVER['QUERY_STRING'] ?? 'N/A',
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
// ======= END DEBUG =======

// Auth routes
$router->add('POST', '/api/register', 'AuthController', 'register');
$router->add('POST', '/api/login', 'AuthController', 'login');
$router->add('POST', '/api/users/ping', 'UserController', 'ping');
$router->add('GET', '/api/users/online', 'UserController', 'online');

// User routes
$router->add('GET', '/api/users', 'UserController', 'index');
$router->add('GET', '/api/users/:id', 'UserController', 'show');
$router->add('PUT', '/api/users/:id', 'UserController', 'update');
$router->add('DELETE', '/api/users/:id', 'UserController', 'delete');
$router->add('POST', '/api/users/:id/follow', 'UserController', 'follow');
$router->add('POST', '/api/users/:id/subscribe', 'UserController', 'subscribe');
$router->add('POST', '/api/users/:id/subscribe-course', 'UserController', 'subscribeCourse');
$router->add('POST', '/api/users/:id/buy-course', 'UserController', 'buyCourseBalance');
$router->add('POST', '/api/users/:id/avatar', 'UserController', 'uploadAvatar');
$router->add('DELETE', '/api/users/:id/devices/:deviceId', 'UserController', 'removeDevice');
$router->add('GET', '/api/users/:id/attendance', 'UserController', 'studentAttendance');

// Attendance routes
$router->add('POST', '/api/attendance/scan', 'UserController', 'registerAttendance');
$router->add('GET', '/api/attendance/pending-sessions', 'UserController', 'pendingSessions');

// Video routes
$router->add('GET', '/api/videos', 'VideoController', 'index');
$router->add('POST', '/api/videos', 'VideoController', 'create');
$router->add('GET', '/api/videos/:id', 'VideoController', 'show');
$router->add('PUT', '/api/videos/:id', 'VideoController', 'update');
$router->add('DELETE', '/api/videos/:id', 'VideoController', 'delete');
$router->add('PUT', '/api/videos/:id/toggle', 'VideoController', 'toggle');
$router->add('PUT', '/api/videos/:id/toggle-visibility', 'VideoController', 'toggleVisibility');
$router->add('POST', '/api/videos/:id/like', 'VideoController', 'like');
$router->add('GET', '/api/videos/:id/watchers', 'VideoController', 'watchers');

// Teacher routes
$router->add('GET', '/api/teachers', 'TeacherController', 'index');
$router->add('GET', '/api/teachers/follower-counts', 'TeacherController', 'getFollowerCounts');
$router->add('GET', '/api/teachers/:id', 'TeacherController', 'show');
$router->add('POST', '/api/teachers', 'TeacherController', 'create');
$router->add('PUT', '/api/teachers/:id', 'TeacherController', 'update');
$router->add('POST', '/api/teachers/:id', 'TeacherController', 'update'); // Support POST updates too
$router->add('DELETE', '/api/teachers/:id', 'TeacherController', 'delete');

// Security routes
$router->add('POST', '/api/security/report', 'SecurityController', 'report');
$router->add('GET', '/api/security/reports', 'SecurityController', 'reports');
$router->add('DELETE', '/api/security/reports', 'SecurityController', 'deleteAll');
$router->add('POST', '/api/security/unlock', 'SecurityController', 'unlock');
$router->add('GET', '/api/security/check-lock', 'SecurityController', 'checkLock');

// Code routes
$router->add('GET', '/api/codes', 'CodeController', 'index');
$router->add('POST', '/api/codes/generate', 'CodeController', 'generate');
$router->add('POST', '/api/codes/verify', 'CodeController', 'verify');
$router->add('PUT', '/api/codes/:id', 'CodeController', 'update');
$router->add('DELETE', '/api/codes/:id', 'CodeController', 'delete');
$router->add('DELETE', '/api/codes', 'CodeController', 'deleteAll');

// Exam routes
$router->add('GET', '/api/exams', 'ExamController', 'index');
$router->add('GET', '/api/exams/admin', 'ExamController', 'adminIndex');
$router->add('POST', '/api/exams/upload-file', 'ExamController', 'uploadFile');
$router->add('POST', '/api/exams/parse-text', 'ExamController', 'parseText');
$router->add('GET', '/api/exams/:id', 'ExamController', 'show');
$router->add('GET', '/api/exams/student/:id/results', 'ExamController', 'studentResults');
$router->add('POST', '/api/exams', 'ExamController', 'create');
$router->add('PUT', '/api/exams/:id', 'ExamController', 'update');
$router->add('DELETE', '/api/exams/:id', 'ExamController', 'delete');
$router->add('DELETE', '/api/exams/:examId/results/:studentId', 'ExamController', 'deleteResult');
$router->add('GET', '/api/exams/:id/results', 'ExamController', 'examResults');
$router->add('POST', '/api/exams/:id/submit', 'ExamController', 'submit');
$router->add('POST', '/api/exams/:examId/grade-essay', 'ExamController', 'gradeEssay');

// Banner routes
$router->add('GET', '/api/banners', 'BannerController', 'index');
$router->add('POST', '/api/banners', 'BannerController', 'create');
$router->add('DELETE', '/api/banners/:id', 'BannerController', 'delete');

// Course routes
$router->add('GET', '/api/courses', 'CourseController', 'index');
$router->add('GET', '/api/courses/:id', 'CourseController', 'show');
$router->add('GET', '/api/courses/:id/videos', 'CourseController', 'videos');
$router->add('POST', '/api/courses/:id/buy', 'CourseController', 'buy');
$router->add('GET', '/api/courses/:id/students', 'CourseController', 'students');
$router->add('POST', '/api/courses', 'CourseController', 'create');
$router->add('PUT', '/api/courses/:id', 'CourseController', 'update');
$router->add('POST', '/api/courses/:id', 'CourseController', 'update');
$router->add('DELETE', '/api/courses/:id', 'CourseController', 'delete');

// Video Question routes
$router->add('GET', '/api/video-questions', 'VideoQuestionController', 'index');
$router->add('POST', '/api/video-questions', 'VideoQuestionController', 'create');
$router->add('DELETE', '/api/video-questions/:id', 'VideoQuestionController', 'delete');

// Serve static HTML/CSS/JS/PHP files for frontend routes
$uri = explode('?', $_SERVER['REQUEST_URI'])[0];
if (strpos($uri, '/api') === false) {
    $filePath = __DIR__ . '/../..' . $uri;
    if ($uri === '/' || $uri === '') {
        $filePath = __DIR__ . '/../../index.php';
    }
    
    if (!file_exists($filePath) || !is_file($filePath)) {
        if (file_exists($filePath . '.php') && is_file($filePath . '.php')) {
            $filePath = $filePath . '.php';
        }
    }
    
    if (file_exists($filePath) && is_file($filePath)) {
        if (str_ends_with($filePath, '.php')) {
            include $filePath;
            exit;
        }
        $mimeType = mime_content_type($filePath);
        if (str_ends_with($filePath, '.css')) {
            $mimeType = 'text/css';
        } elseif (str_ends_with($filePath, '.js')) {
            $mimeType = 'application/javascript';
        }
        header("Content-Type: $mimeType");
        readfile($filePath);
        exit;
    } else {
        $fallback = __DIR__ . '/../../index.php';
        if (file_exists($fallback)) {
            include $fallback;
            exit;
        }
        exit;
    }
}

// Dispatch API routes
$router->dispatch();
