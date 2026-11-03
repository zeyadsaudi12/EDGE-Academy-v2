const fs = require('fs');
let html = fs.readFileSync('profile.html', 'utf8');

// 1. Remove the animated shapes .vortex-bg completely from the DOM
const vortexBlock = `<!-- الخلفية المتحركة -->
<div class="vortex-bg">
    <div class="shape s1"></div><div class="shape s2"></div><div class="shape s3"></div>
</div>`;

if (html.includes(vortexBlock)) {
    html = html.replace(vortexBlock, '');
    console.log('✅ Removed vortex-bg completely');
} else {
    // Try regex
    html = html.replace(/<!-- الخلفية المتحركة -->\s*<div class="vortex-bg">[\s\S]*?<\/div>/, '');
    console.log('✅ Removed vortex-bg via regex');
}

// 2. Fix body and royal-wrapper spacing
// In profile.html:
// body.royal-dashboard has margin: 0; padding: 0; which overrides padding-top: 104px!
// Because style.css has `body:not(.auth-body) { padding-top: 104px; }`
// But profile.html had `body.royal-dashboard { ... padding: 0; }`!
// That's why the navbar was overlapping the top of royal-wrapper or causing a weird cut/gap!
const oldBodyCss = `        body.royal-dashboard {
            background-color: var(--profile-bg) !important;
            color: var(--profile-text) !important;
            font-family: 'Tajawal', 'Cairo', sans-serif;
            min-height: 100vh;
            margin: 0;
            padding: 0;
        }`;

const newBodyCss = `        body.royal-dashboard {
            background-color: var(--profile-bg) !important;
            color: var(--profile-text) !important;
            font-family: 'Tajawal', 'Cairo', sans-serif;
            min-height: 100vh;
            margin: 0;
            padding-top: 104px !important;
        }

        /* Hide any stray background shapes on profile page */
        .vortex-bg, .shape {
            display: none !important;
        }`;

if (html.includes(oldBodyCss)) {
    html = html.replace(oldBodyCss, newBodyCss);
    console.log('✅ Fixed body.royal-dashboard padding-top');
} else {
    console.error('❌ Could not find oldBodyCss');
}

// 3. Adjust royal-wrapper margin-top to be clean and snug
html = html.replace(
    'margin: 20px auto 60px;',
    'margin: 24px auto 60px;'
);

// 4. Ensure sticky sidebar top is aligned with fixed navbar
html = html.replace(
    'top: 110px;',
    'top: 120px;'
);

fs.writeFileSync('profile.html', html, 'utf8');
console.log('🎉 Done fixing navbar gap & shapes in profile.html');

