<?php
if (!isset($page_title)) {
    $page_title = "EDGE Academy";
}
?>
<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css?v=1.2">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <title><?php echo htmlspecialchars($page_title); ?></title>
    <?php if (isset($extra_headers)) { echo $extra_headers; } ?>
</head>
<body class="<?php echo isset($body_class) ? htmlspecialchars($body_class) : ''; ?>">
<header>
    <div class="header-inner">
        <!-- اليسار: أزرار الأوضاع -->
        <div class="header-left">
            <div class="header-icons">
                <button class="icon-btn theme-switcher" data-theme="light" aria-label="وضع النهار">☀</button>
                <button class="icon-btn theme-switcher" data-theme="dark" aria-label="وضع الظلام">🌙</button>
            </div>
        </div>

        <!-- المنتصف: روابط التنقل -->
        <div class="header-center">
            <a href="index.php" class="nav-link-item <?php echo (isset($active_tab) && $active_tab == 'index') ? 'active' : ''; ?>">الرئيسية</a>
            <a href="teachers.php" class="nav-link-item <?php echo (isset($active_tab) && $active_tab == 'teachers') ? 'active' : ''; ?>">المعلمين</a>
            <a href="subjects.php" class="nav-link-item <?php echo (isset($active_tab) && $active_tab == 'subjects') ? 'active' : ''; ?>">المواد الدراسية</a>
            <a href="courses.php" class="nav-link-item <?php echo (isset($active_tab) && $active_tab == 'courses') ? 'active' : ''; ?>">الكورسات</a>
            <a href="exams.php" class="nav-link-item <?php echo (isset($active_tab) && $active_tab == 'exams') ? 'active' : ''; ?>">الامتحانات</a>
            <!-- زر لوحة تحكم الأدمن (يظهر فقط إذا كان المستخدم مسجل كـ Admin) -->
            <a href="admin.php" class="nav-link-item admin-portal-nav-btn" id="adminPortalNavBtn" style="display: none; background: linear-gradient(135deg, #f4a261, #e76f51); color: #fff !important; padding: 6px 14px; border-radius: 999px; font-weight: 800; box-shadow: 0 4px 12px rgba(231,111,81,0.35); text-decoration: none;">
                <i class="fas fa-crown"></i> صفحة الادمن
            </a>
        </div>

        <!-- اليمين: إجراءات المستخدم -->
        <nav class="header-actions" id="authActions">
            <a href="login.php" class="btn-outline">تسجيل الدخول</a>
            <a href="register.php" class="btn-fill">حساب جديد</a>
        </nav>

        <!-- قائمة الطالب عند تسجيل الدخول -->
        <div class="user-dropdown-container" id="userDropdownArea" style="display: none;">
            <button class="user-menu-btn" onclick="toggleUserMenu()">
                <span id="navUserName">الطالب</span>
                <div class="user-icon-circle">👤</div>
            </button>
            <div class="user-dropdown-menu" id="userMenu">
                <!-- خيار صفحة الأدمن داخل القائمة المنسدلة -->
                <a href="admin.php" class="menu-item" id="adminMenuLink" style="display: none; color: #e76f51; font-weight: 800; border-bottom: 1px dashed var(--border);">
                    👑 صفحة الادمن
                </a>
                <a href="profile.php" class="menu-item">👤 البروفايل</a>
                <div class="menu-item balance-item">
                    <span>💰 الرصيد:</span>
                    <span id="userPoints">0</span> ج.م
                </div>
                <hr>
                <button onclick="handleLogout()" class="menu-item logout-btn">🚪 تسجيل خروج</button>
            </div>
        </div>

        <!-- زر الهامبرغر (يظهر فقط على الموبايل) -->
        <button class="hamburger-btn" onclick="toggleMobileMenu()" aria-label="القائمة">
            <i class="fas fa-bars"></i>
        </button>
    </div>

    <!-- قائمة الموبايل المنسدلة -->
    <div class="mobile-nav-menu" id="mobileNavMenu">
        <a href="admin.php" class="mobile-nav-link" id="mobileAdminLink" style="display:none; color:#e76f51; font-weight:800; background:rgba(231,111,81,0.1); border-radius:8px; margin:4px 0;">
            👑 صفحة الادمن
        </a>
        <a href="index.php" class="mobile-nav-link <?php echo (isset($active_tab) && $active_tab == 'index') ? 'active' : ''; ?>">🏠 الرئيسية</a>
        <a href="teachers.php" class="mobile-nav-link <?php echo (isset($active_tab) && $active_tab == 'teachers') ? 'active' : ''; ?>">👨‍🏫 المعلمين</a>
        <a href="subjects.php" class="mobile-nav-link <?php echo (isset($active_tab) && $active_tab == 'subjects') ? 'active' : ''; ?>">📚 المواد الدراسية</a>
        <a href="courses.php" class="mobile-nav-link <?php echo (isset($active_tab) && $active_tab == 'courses') ? 'active' : ''; ?>">🎥 الكورسات</a>
        <a href="exams.php" class="mobile-nav-link <?php echo (isset($active_tab) && $active_tab == 'exams') ? 'active' : ''; ?>">📝 الامتحانات</a>
        <div class="mobile-menu-auth" id="mobileAuthGuest">
            <a href="login.php" class="btn-outline" style="text-align:center;">تسجيل الدخول</a>
            <a href="register.php" class="btn-fill" style="text-align:center;">حساب جديد</a>
        </div>
        <div class="mobile-menu-auth" id="mobileAuthUser" style="display:none;">
            <a href="profile.php" class="mobile-nav-link">👤 البروفايل</a>
            <button onclick="handleLogout()" class="mobile-nav-link" style="background:none;border:none;cursor:pointer;width:100%;text-align:right;color:var(--text-dark);font-family:inherit;">🚪 تسجيل خروج</button>
        </div>
    </div>
</header>
