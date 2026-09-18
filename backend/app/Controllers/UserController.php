<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\User;
use App\Models\Code;
use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

class UserController extends Controller {
    
    // GET /api/users
    public function index($input) {
        $usersCollection = User::getCollection();
        $cursor = $usersCollection->find(
            ['role' => 'student'],
            ['projection' => ['password' => 0]]
        );
        $users = User::toArrayMultiple($cursor);
        $this->json($users);
    }

    // GET /api/users/:id
    public function show($id, $input) {
        if ($id === 'admin-master-id' || strlen($id) !== 24 || !ctype_xdigit($id)) {
            // Support admin-master-id
            if ($id === 'admin-master-id') {
                return $this->success([
                    'user' => [
                        '_id' => 'admin-master-id',
                        'role' => 'admin',
                        'firstName' => 'الإدارة',
                        'lastName' => '',
                        'phone' => '01556448880'
                    ]
                ]);
            }
            return $this->error('معرف مستخدم غير صالح', 400);
        }

        try {
            $usersCollection = User::getCollection();
            $user = $usersCollection->findOne(['_id' => new ObjectId($id)]);
            if (!$user) {
                return $this->error('المستخدم غير موجود', 404);
            }
            $this->success(['user' => User::toArray($user)]);
        } catch (\Exception $e) {
            $this->error('حدث خطأ في جلب بيانات الطالب', 500);
        }
    }

    // POST /api/users/ping
    public function ping($input) {
        $userId = $input['userId'] ?? null;
        $deviceId = $input['deviceId'] ?? null;
        if (!$userId) {
            return $this->error('ID required', 400);
        }

        if ($userId === 'admin-master-id' || strlen($userId) !== 24 || !ctype_xdigit($userId)) {
            return $this->success(['note' => 'Skipped invalid student ID']);
        }

        try {
            $usersCollection = User::getCollection();
            $user = $usersCollection->findOne(['_id' => new ObjectId($userId)]);
            
            if ($user && isset($user['role']) && $user['role'] === 'student') {
                $devices = isset($user['devices']) ? iterator_to_array($user['devices']) : [];
                
                if (!empty($deviceId)) {
                    $found = false;
                    foreach ($devices as $device) {
                        if (isset($device['deviceId']) && $device['deviceId'] === $deviceId) {
                            $found = true;
                            break;
                        }
                    }
                    if (!$found) {
                        if (count($devices) === 0) {
                            // Register first device silently for old logged-in users
                            $devices[] = [
                                'deviceId' => $deviceId,
                                'deviceName' => 'جهاز مسجل تلقائياً',
                                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                                'lastUsed' => new UTCDateTime(time() * 1000)
                            ];
                            $usersCollection->updateOne(
                                ['_id' => $user['_id']],
                                ['$set' => ['devices' => $devices]]
                            );
                        } else {
                            return $this->error('device_not_registered', 403);
                        }
                    }
                }
            }

            $usersCollection->updateOne(
                ['_id' => new ObjectId($userId)],
                ['$set' => ['lastActive' => new UTCDateTime(time() * 1000)]]
            );
            $this->success();
        } catch (\Exception $e) {
            $this->error($e->getMessage(), 500);
        }
    }

    // GET /api/users/online
    public function online($input) {
        $usersCollection = User::getCollection();
        // 2 minutes ago
        $twoMinutesAgo = (time() - 2 * 60) * 1000;
        
        $cursor = $usersCollection->find(
            ['lastActive' => ['$gte' => new UTCDateTime($twoMinutesAgo)]],
            ['projection' => [
                'firstName' => 1,
                'lastName' => 1,
                'phone' => 1,
                'grade' => 1,
                'role' => 1,
                'lastActive' => 1
            ]]
        );

        $onlineUsers = User::toArrayMultiple($cursor);
        $this->json($onlineUsers);
    }

    // PUT /api/users/:id
    public function update($id, $input) {
        if ($id === 'admin-master-id' || strlen($id) !== 24 || !ctype_xdigit($id)) {
            return $this->error('معرف مستخدم غير صالح', 400);
        }

        try {
            $usersCollection = User::getCollection();
            // Prevent changing ID and password from this endpoint
            unset($input['_id']);
            unset($input['password']);

            // Convert birthDate if present
            if (isset($input['birthDate'])) {
                $input['birthDate'] = new UTCDateTime(strtotime($input['birthDate']) * 1000);
            }

            // Convert lastActive if present
            if (isset($input['lastActive'])) {
                unset($input['lastActive']);
            }

            $usersCollection->updateOne(
                ['_id' => new ObjectId($id)],
                ['$set' => $input]
            );

            $updatedUser = $usersCollection->findOne(['_id' => new ObjectId($id)], ['projection' => ['password' => 0]]);
            $this->success(['user' => User::toArray($updatedUser)]);
        } catch (\Exception $e) {
            $this->error('حدث خطأ في تحديث بيانات الطالب', 500);
        }
    }

    // DELETE /api/users/:id
    public function delete($id, $input) {
        if (strlen($id) !== 24 || !ctype_xdigit($id)) {
            return $this->error('معرف مستخدم غير صالح', 400);
        }

        try {
            $usersCollection = User::getCollection();
            $usersCollection->deleteOne(['_id' => new ObjectId($id)]);
            $this->success();
        } catch (\Exception $e) {
            $this->error('حدث خطأ في حذف الطالب', 500);
        }
    }

    // POST /api/users/:id/follow
    public function follow($id, $input) {
        if ($id === 'admin-master-id' || strlen($id) !== 24 || !ctype_xdigit($id)) {
            return $this->error('معرف مستخدم غير صالح', 400);
        }

        $teacherId = $input['teacherId'] ?? null;
        if (!$teacherId) {
            return $this->error('Teacher ID required', 400);
        }

        try {
            $usersCollection = User::getCollection();
            $user = $usersCollection->findOne(['_id' => new ObjectId($id)]);
            if (!$user) {
                return $this->error('المستخدم غير موجود', 404);
            }

            // Extract followed teachers (MongoDB array)
            // Ensure it's an array
            $followedTeachers = isset($user['followedTeachers']) ? iterator_to_array($user['followedTeachers']) : [];
            $index = array_search($teacherId, $followedTeachers);
            $isFollowing = false;

            if ($index !== false) {
                array_splice($followedTeachers, $index, 1);
            } else {
                $followedTeachers[] = $teacherId;
                $isFollowing = true;
            }

            $usersCollection->updateOne(
                ['_id' => new ObjectId($id)],
                ['$set' => ['followedTeachers' => $followedTeachers]]
            );

            $this->success([
                'isFollowing' => $isFollowing,
                'followedTeachers' => $followedTeachers
            ]);
        } catch (\Exception $e) {
            $this->error('حدث خطأ أثناء تحديث المتابعة', 500);
        }
    }

    // POST /api/users/:id/subscribe
    public function subscribe($id, $input) {
        if ($id === 'admin-master-id' || strlen($id) !== 24 || !ctype_xdigit($id)) {
            return $this->error('معرف مستخدم غير صالح', 400);
        }

        $codeStr = $input['codeStr'] ?? null;
        $videoId = $input['videoId'] ?? null;

        if (!$codeStr || !$videoId) {
            return $this->error('كود الشحن ومعرف الفيديو مطلوبان', 400);
        }

        try {
            $codesCollection = Code::getCollection();
            $usersCollection = User::getCollection();

            // 1. Verify recharge code
            $code = $codesCollection->findOne(['code' => $codeStr, 'videoId' => $videoId]);
            if (!$code) {
                return $this->error('كود الشحن غير صحيح أو لا يخص هذه المحاضرة', 404);
            }

            $views = $code['views'] ?? 0;
            if ($views >= 1) {
                return $this->error('هذا الكود مستخدم بالفعل (صالح للاستخدام مرة واحدة فقط)', 400);
            }

            $studentId = $code['studentId'] ?? null;
            if ($studentId && (string)$studentId !== $id) {
                return $this->error('كود الشحن مستخدم بالفعل بواسطة طالب آخر', 403);
            }

            // 2. Fetch User and Subscribe
            $user = $usersCollection->findOne(['_id' => new ObjectId($id)]);
            if (!$user) {
                return $this->error('المستخدم غير موجود', 404);
            }

            $subscribedVideos = isset($user['subscribedVideos']) ? iterator_to_array($user['subscribedVideos']) : [];
            if (!in_array($videoId, $subscribedVideos)) {
                $subscribedVideos[] = $videoId;
            }

            // 3. Update User and Code
            $usersCollection->updateOne(
                ['_id' => new ObjectId($id)],
                ['$set' => ['subscribedVideos' => $subscribedVideos]]
            );

            $codesCollection->updateOne(
                ['_id' => $code['_id']],
                ['$set' => [
                    'views' => $views + 1,
                    'used' => true,
                    'studentId' => $id
                ]]
            );

            // Re-fetch updated user
            $updatedUser = $usersCollection->findOne(['_id' => new ObjectId($id)]);

            $this->success([
                'remainingViews' => 1 - ($views + 1),
                'user' => User::toArray($updatedUser)
            ]);
        } catch (\Exception $e) {
            $this->error('حدث خطأ أثناء تفعيل الاشتراك: ' . $e->getMessage(), 500);
        }
    }


 // POST /api/attendance/scan (دالة التحضير المحدثة لمعالجة اختلاف أنواع البيانات)
    public function registerAttendance($input) {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $scannedEmail = $data['studentId'] ?? null;
            $videoId = $data['videoId'] ?? null;
            $center = $data['center'] ?? '—';
            $day = $data['day'] ?? '—';
            $grade = $data['grade'] ?? '—';
            $time = $data['time'] ?? '—';

            if (!$scannedEmail || !$videoId) {
                return $this->error('بيانات الطالب والمحاضرة مطلوبة', 400);
            }

            $usersCollection = \App\Models\User::getCollection();
            
            // استخراج اسم المستخدم (username) من البريد الإلكتروني الممسوح
            $username = explode('@', $scannedEmail)[0];
            
            // البحث عن الطالب في قاعدة البيانات
            $user = $usersCollection->findOne(['username' => $username]);

            if (!$user) {
                return $this->error('البريد الإلكتروني الممسوح غير مسجل بالمنصة', 404);
            }

            $studentId = $user['_id']; // جلب الـ ObjectId الحقيقي للطالب

            // 1. جلب المحاضرات الحالية وتنقيتها
            $subscribedRaw = isset($user['subscribedVideos']) ? (array)$user['subscribedVideos'] : [];
            
            // 🌟 ميزة الإصلاح التلقائي الذكي: تحويل أي معرّفات قديمة تم حفظها كـ نصوص (String) إلى ObjectId فوراً
            $subscribed = [];
            foreach ($subscribedRaw as $v) {
                if ($v instanceof \MongoDB\BSON\ObjectId) {
                    $subscribed[] = $v;
                } elseif (is_string($v) && strlen($v) === 24 && ctype_xdigit($v)) {
                    $subscribed[] = new \MongoDB\BSON\ObjectId($v);
                } else {
                    $subscribed[] = $v;
                }
            }

            // تحديد قيمة الفيديو بصيغة ObjectId الأصلية لتتوافق مع نظام المنصة والـ watch.html
            if ($videoId !== 'pending') {
                $videoDbId = new \MongoDB\BSON\ObjectId($videoId);
            } else {
                $videoDbId = 'pending';
            }

            // تفعيل الفيديو مباشرة لحساب الطالب
            if (!in_array($videoDbId, $subscribed)) {
                $subscribed[] = $videoDbId;
                $usersCollection->updateOne(
                    ['_id' => $studentId],
                    ['$set' => ['subscribedVideos' => $subscribed]]
                );
            }

            // 2. تسجيل وحفظ تقرير حضور تفصيلي في كوليكشن الحضور بقاعدة البيانات
            $attendanceCollection = \App\Models\Attendance::getCollection();
            
            $attendanceCollection->insertOne([
                'studentId' => $studentId,
                'studentName' => ($user['firstName'] ?? '') . ' ' . ($user['lastName'] ?? ''),
                'studentPhone' => $user['phone'] ?? '',
                'studentEmail' => $username . '@edgeacademy.edu',
                'videoId' => $videoId === 'pending' ? 'pending' : new \MongoDB\BSON\ObjectId($videoId),
                'center' => $center,
                'day' => $day,
                'grade' => $grade,
                'time' => $time,
                'scannedAt' => new \MongoDB\BSON\UTCDateTime(time() * 1000)
            ]);

            $this->success([
                'message' => 'تم تسجيل الحضور وتفعيل الكورس بنجاح ✅',
                'studentName' => ($user['firstName'] ?? '') . ' ' . ($user['lastName'] ?? '')
            ]);
        } catch (\Throwable $e) {
            $this->error('خطأ برمجي في السيرفر: ' . $e->getMessage() . ' في السطر ' . $e->getLine(), 500);
        }
    }


    // GET /api/attendance/pending-sessions (جلب الحصص المعلقة من خلال الموديل الجديد دون أي توقف)
    public function pendingSessions($input) {
        try {
            $attendanceCollection = \App\Models\Attendance::getCollection();
            
            // جلب المجموعات الفريدة من جدول الحضور المعلق (videoId = pending)
            $cursor = $attendanceCollection->aggregate([
                ['$match' => ['videoId' => 'pending']],
                ['$group' => [
                    '_id' => [
                        'center' => '$center',
                        'day' => '$day',
                        'grade' => '$grade'
                    ],
                    'count' => ['$sum' => 1]
                ]]
            ]);
            
            $sessions = [];
            foreach ($cursor as $doc) {
                $sessions[] = [
                    'center' => $doc['_id']['center'],
                    'day' => $doc['_id']['day'],
                    'grade' => $doc['_id']['grade'],
                    'count' => $doc['count']
                ];
            }
            
            $this->success(['sessions' => $sessions]);
        } catch (\Throwable $e) {
            // اصطياد وتمرير الخطأ بوضوح في حال حدوث أي عطل
            $this->error('خطأ برمجي في السيرفر: ' . $e->getMessage() . ' في السطر ' . $e->getLine(), 500);
        }
    }

    // GET /api/users/:id/attendance (جلب سجل حضور الطالب بالسنتر بالكامل)
    public function studentAttendance($id, $input) {
        if (strlen($id) !== 24 || !ctype_xdigit($id)) {
            return $this->error('معرف غير صالح', 400);
        }

        try {
            $usersCollection = User::getCollection();
            $user = $usersCollection->findOne(['_id' => new ObjectId($id)]);
            if (!$user) {
                return $this->error('المستخدم غير موجود', 404);
            }

            $username = $user['username'] ?? '';
            $phone = $user['phone'] ?? '';

            $attendanceCollection = \App\Models\Attendance::getCollection();
            $cursor = $attendanceCollection->find([
                '$or' => [
                    ['studentId' => $id],
                    ['studentId' => new ObjectId($id)],
                    ['studentPhone' => $phone],
                    ['studentEmail' => ['$regex' => '^' . preg_quote($username, '/') . '@', '$options' => 'i']]
                ]
            ], ['sort' => ['scannedAt' => -1]]);

            $records = \App\Models\Attendance::toArrayMultiple($cursor);
            $this->success(['attendance' => $records]);
        } catch (\Throwable $e) {
            $this->error('خطأ: ' . $e->getMessage(), 500);
        }
    }

    // POST /api/users/:id/avatar
    public function uploadAvatar($id, $input) {
        if ($id === 'admin-master-id' || strlen($id) !== 24 || !ctype_xdigit($id)) {
            return $this->error('معرف مستخدم غير صالح', 400);
        }

        if (!isset($_FILES['avatar'])) {
            return $this->error('لم يتم تحديد أي صورة لرفعها', 400);
        }

        $uploadsDir = __DIR__ . '/../../../uploads';
        $imagePath = $this->handleFileUpload('avatar', $uploadsDir);

        if (!$imagePath) {
            return $this->error('فشل في رفع الصورة، يرجى التأكد من امتداد وحجم الملف', 400);
        }

        try {
            $usersCollection = User::getCollection();
            $user = $usersCollection->findOne(['_id' => new ObjectId($id)]);
            if (!$user) {
                return $this->error('المستخدم غير موجود', 404);
            }

            // Delete old avatar file if it exists and is local
            if (isset($user['imagePath']) && !empty($user['imagePath'])) {
                $oldFilePath = __DIR__ . '/../../..' . $user['imagePath'];
                if (file_exists($oldFilePath) && is_file($oldFilePath)) {
                    @unlink($oldFilePath);
                }
            }

            // Update user imagePath
            $usersCollection->updateOne(
                ['_id' => new ObjectId($id)],
                ['$set' => ['imagePath' => $imagePath, 'updatedAt' => new UTCDateTime(time() * 1000)]]
            );

            // Re-fetch updated user
            $updatedUser = $usersCollection->findOne(['_id' => new ObjectId($id)]);

            $this->success([
                'imagePath' => $imagePath,
                'user' => User::toArray($updatedUser)
            ], 'تم تحديث الصورة الشخصية بنجاح ✅');
        } catch (\Exception $e) {
            $this->error('حدث خطأ أثناء تحديث الصورة الشخصية: ' . $e->getMessage(), 500);
        }
    }

    // DELETE /api/users/:id/devices/:deviceId
    public function removeDevice($id, $deviceId, $input) {
        if (!$id || !$deviceId) {
            return $this->error('Missing parameters', 400);
        }

        try {
            $usersCollection = User::getCollection();
            $user = $usersCollection->findOne(['_id' => new \MongoDB\BSON\ObjectId($id)]);
            if (!$user) {
                return $this->error('User not found', 404);
            }

            $devices = isset($user['devices']) ? iterator_to_array($user['devices']) : [];
            $newDevices = [];
            foreach ($devices as $device) {
                if (isset($device['deviceId']) && $device['deviceId'] === $deviceId) {
                    continue;
                }
                $newDevices[] = $device;
            }

            $usersCollection->updateOne(
                ['_id' => new \MongoDB\BSON\ObjectId($id)],
                ['$set' => ['devices' => $newDevices]]
            );

            return $this->success(null, 'تم إلغاء ربط الجهاز بنجاح ✅');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
