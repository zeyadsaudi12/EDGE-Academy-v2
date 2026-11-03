const fs = require('fs');
let html = fs.readFileSync('profile.html', 'utf8');

// 1. Remove vortex-bg if desired or disable its loud colors in profile
// Let's replace vortex-bg styling or remove the div
html = html.replace(
`<div class="vortex-bg">
    <div class="shape s1"></div><div class="shape s2"></div><div class="shape s3"></div>
</div>`,
`<!-- Subtle clean background -->`
);

// 2. Redesign layout CSS
// Let's find the CSS block from .royal-wrapper to .dynamic-stats-row and replace with modern, clean styling
const oldCssMatch = html.match(/\/\* ── Master Grid Layout ── \*\/[\s\S]*?\/\* ── User Information Cards ── \*\//);
if (oldCssMatch) {
    const modernCss = `/* ── Master Grid Layout ── */
        .royal-wrapper {
            display: grid;
            grid-template-columns: 280px minmax(0, 1fr);
            gap: 28px;
            max-width: 1320px;
            width: calc(100% - 48px);
            margin: 20px auto 60px;
            padding: 0;
            align-items: start;
            box-sizing: border-box;
        }

        /* ── Sidebar (شريط الأدوات الجانبي العصري للبروفايل) ── */
        .royal-sidebar {
            background: var(--profile-card) !important;
            border: 1px solid var(--profile-border) !important;
            border-radius: 20px !important;
            padding: 20px 14px !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03) !important;
            position: sticky;
            top: 110px;
            box-sizing: border-box;
            z-index: 80;
        }

        .sidebar-drawer-top-bar {
            display: none;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 12px;
            margin-bottom: 14px;
            border-bottom: 1px solid var(--profile-border);
        }

        .sidebar-drawer-title {
            font-size: 0.95rem;
            font-weight: 900;
            color: var(--profile-primary);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .sidebar-close-btn {
            display: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--profile-card-alt);
            border: 1px solid var(--profile-border);
            color: var(--profile-muted);
            font-size: 0.95rem;
            cursor: pointer;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .sidebar-close-btn:hover {
            background: #fee2e2;
            color: #dc2626;
            border-color: #fca5a5;
        }

        /* User Header in Sidebar (Compact & Elegant) */
        .sidebar-user-header {
            text-align: center;
            padding-bottom: 16px;
            margin-bottom: 14px;
            border-bottom: 1px solid var(--profile-border);
            position: relative;
        }

        .avatar-container {
            position: relative;
            width: 76px;
            height: 76px;
            margin: 0 auto 10px;
        }

        .sidebar-avatar {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 3px solid var(--profile-primary) !important;
            box-shadow: 0 4px 14px rgba(26, 107, 219, 0.2);
            object-fit: cover;
            background: var(--profile-card-alt);
        }

        .online-pulse {
            position: absolute;
            bottom: 2px;
            right: 2px;
            width: 14px;
            height: 14px;
            background: var(--profile-accent) !important;
            border: 2.5px solid var(--profile-card) !important;
            border-radius: 50%;
        }

        .avatar-hover-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.2s ease;
            color: #ffffff;
            font-size: 1.1rem;
        }

        .avatar-container:hover .avatar-hover-overlay {
            opacity: 1;
        }

        .sidebar-user-header h4 {
            font-size: 1.05rem;
            font-weight: 900;
            color: var(--profile-text);
            margin: 0 0 6px 0;
        }

        .sidebar-user-header p {
            display: inline-block;
            font-size: 0.78rem;
            font-weight: 800;
            color: var(--profile-primary);
            background: rgba(26, 107, 219, 0.08);
            padding: 3px 12px;
            border-radius: 50px;
            margin: 0;
        }

        /* ── Sidebar Navigation Items ── */
        .sidebar-category-header {
            font-size: 0.72rem;
            font-weight: 800;
            color: var(--profile-muted);
            padding: 8px 10px 4px;
            margin-top: 4px;
            opacity: 0.75;
            display: flex;
            align-items: center;
            gap: 8px;
            user-select: none;
        }

        .sidebar-category-header::after {
            content: "";
            flex: 1;
            height: 1px;
            background: var(--profile-border);
            opacity: 0.6;
        }

        .sidebar-category-header:first-of-type {
            margin-top: 0;
            padding-top: 0;
        }

        .sidebar-nav {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .side-item {
            width: 100%;
            padding: 10px 14px;
            border: none;
            background: transparent;
            color: var(--profile-muted);
            border-radius: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 800;
            font-size: 0.9rem;
            transition: all 0.2s ease;
            text-align: right;
            font-family: inherit;
            box-sizing: border-box;
        }

        .side-item i {
            font-size: 1.05rem;
            width: 20px;
            text-align: center;
            color: var(--profile-muted);
            transition: color 0.2s;
        }

        .side-item:hover {
            background: rgba(26, 107, 219, 0.06) !important;
            color: var(--profile-primary) !important;
        }

        .side-item:hover i {
            color: var(--profile-primary) !important;
        }

        .side-item.active {
            background: #1a6bdb !important;
            color: #ffffff !important;
            box-shadow: 0 4px 14px rgba(26, 107, 219, 0.25) !important;
        }

        .side-item.active i {
            color: #ffffff !important;
        }

        /* ── Main Content Area (Clean & Modern Card) ── */
        .royal-content {
            background: var(--profile-card) !important;
            border: 1px solid var(--profile-border) !important;
            border-radius: 20px !important;
            padding: 28px !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03) !important;
            min-height: 520px;
            box-sizing: border-box;
        }

        .glass-section-title {
            border-bottom: 1px solid var(--profile-border) !important;
            margin-bottom: 22px;
            padding-bottom: 10px;
        }

        .glass-section-title h3 {
            font-size: 1.15rem;
            font-weight: 900;
            color: var(--profile-text);
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0;
        }

        .glass-section-title h3 i {
            color: var(--profile-primary);
            font-size: 1.1rem;
        }

        /* ── Mobile Section Header Card ── */
        .mobile-section-header-card {
            display: none;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            background: var(--profile-card-alt);
            border: 1px solid var(--profile-border);
            border-radius: 14px;
            padding: 12px 16px;
            margin-bottom: 20px;
            cursor: pointer;
            box-sizing: border-box;
            transition: all 0.2s ease;
        }

        .mobile-section-header-card:hover,
        .mobile-section-header-card:active {
            background: rgba(26, 107, 219, 0.06);
            border-color: var(--profile-primary);
        }

        .mobile-section-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
            text-align: right;
        }

        .mobile-section-label {
            font-size: 0.72rem;
            font-weight: 800;
            color: var(--profile-muted);
        }

        .mobile-section-current {
            margin: 0;
            font-size: 1rem;
            font-weight: 900;
            color: var(--profile-primary);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .btn-change-section {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 50px;
            background: var(--profile-primary);
            color: #ffffff;
            font-size: 0.8rem;
            font-weight: 800;
            border: none;
            flex-shrink: 0;
        }

        /* ── Mobile Sidebar Backdrop ── */
        .sidebar-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(13, 21, 38, 0.65);
            backdrop-filter: blur(4px);
            z-index: 9998;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        .sidebar-backdrop.show {
            opacity: 1;
            pointer-events: auto;
        }

        /* ── User Information Cards ── */`;

    html = html.replace(oldCssMatch[0], modernCss);
    console.log('✅ Updated master layout & sidebar CSS');
} else {
    console.error('❌ Could not find oldCssMatch');
}

// 3. Update info-item to have distinct clean borders and nice spacing
html = html.replace(
`.user-info-display {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 28px;
        }`,
`.user-info-display {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-bottom: 26px;
        }`
);

// 4. In tab-user, remove the redundant student-qr-card since tab-qr-card already has the complete QR pass!
// Replacing it with an elegant banner link to tab-qr-card
const qrCardInUserTab = html.match(/<!-- كارت QR الطالب لحضور الحصص بالسنتر -->[\s\S]*?<div class="glass-section-title"><h3><i class="fas fa-chart-pie">/);
if (qrCardInUserTab) {
    const compactQrBanner = `<!-- كارت تذكير الحضور السريع -->
            <div style="background:linear-gradient(135deg, rgba(26,107,219,0.06), rgba(0,184,148,0.06)); border:1px solid rgba(26,107,219,0.18); border-radius:16px; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:26px; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:14px;">
                    <div style="width:44px; height:44px; border-radius:12px; background:#1a6bdb; color:#fff; display:grid; place-items:center; font-size:1.3rem; flex-shrink:0;">
                        <i class="fas fa-qrcode"></i>
                    </div>
                    <div>
                        <h4 style="margin:0 0 2px; font-size:0.98rem; font-weight:900; color:var(--profile-text);">كارت حضور السنتر الذكي (QR Pass)</h4>
                        <p style="margin:0; font-size:0.82rem; color:var(--profile-muted); font-weight:700;">رمز الحضور الفوري والباركود المخصص لحضور الحصص والسناتر.</p>
                    </div>
                </div>
                <button type="button" onclick="switchTab('tab-qr-card', this)" style="background:#1a6bdb; color:#fff; border:none; padding:8px 18px; border-radius:50px; font-weight:800; font-size:0.85rem; cursor:pointer; display:inline-flex; align-items:center; gap:8px; transition:0.2s;">
                    عرض كارت الحضور <i class="fas fa-arrow-left"></i>
                </button>
            </div>

            <div class="glass-section-title"><h3><i class="fas fa-chart-pie">`;

    html = html.replace(qrCardInUserTab[0], compactQrBanner);
    console.log('✅ Replaced duplicated giant QR in tab-user with an elegant link banner');
}

fs.writeFileSync('profile.html', html, 'utf8');
console.log('🎉 Successfully cleaned and modernized student profile layout!');

