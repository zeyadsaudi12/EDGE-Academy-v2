<aside class="royal-sidebar">
    <div class="sidebar-user-header">
        <div class="avatar-container" onclick="document.getElementById('avatarInput').click()" style="cursor: pointer;" title="تغيير الصورة الشخصية">
            <img src="imges/man.png" id="profileImg" class="sidebar-avatar" alt="الصورة الشخصية">
            <span class="online-pulse"></span>
            <div class="avatar-hover-overlay">
                <i class="fas fa-camera"></i>
            </div>
            <input type="file" id="avatarInput" accept="image/*" style="display:none;">
        </div>
        <h4 id="sideUserName">طالب EDGE Academy</h4>
        <p id="sideUserGrade">-</p>
    </div>
    <nav class="sidebar-nav">
        <button class="side-item active" onclick="switchTab('tab-user', this)"><i class="fas fa-user-circle"></i> ملف المستخدم</button>
        <button class="side-item" onclick="switchTab('tab-qr-card', this)"><i class="fas fa-qrcode"></i> كارت الحضور (QR)</button>
        <button class="side-item" onclick="switchTab('tab-teachers', this)"><i class="fas fa-user-tie"></i> المدرسين</button>
        <button class="side-item" onclick="switchTab('tab-recharge', this)"><i class="fas fa-qrcode"></i> شحن كود سنتر</button>
        <button class="side-item" onclick="switchTab('tab-my-courses', this)"><i class="fas fa-graduation-cap"></i> كورساتي</button>
        <button class="side-item" onclick="switchTab('tab-invoices', this)"><i class="fas fa-file-invoice-dollar"></i> الفواتير</button>
        <button class="side-item" onclick="switchTab('tab-subs', this)"><i class="fas fa-calendar-check"></i> الاشتراكات</button>
        <button class="side-item" onclick="switchTab('tab-results', this)"><i class="fas fa-poll"></i> نتائج الامتحانات</button>
    </nav>
</aside>
