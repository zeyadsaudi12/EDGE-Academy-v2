const fs = require('fs');

let code = fs.readFileSync('script.js', 'utf8');

const target = 'initArabicNameInputs();';
const injection = `initArabicNameInputs();

    // Init Secret Robot EDGE Scavenger Hunt (+15 Points)
    if (!document.getElementById('edge-robot-script') && !window.location.pathname.includes('/admin')) {
        const rScript = document.createElement('script');
        rScript.id = 'edge-robot-script';
        rScript.src = 'edge-robot.js?v=20261103';
        rScript.defer = true;
        document.body.appendChild(rScript);
    }`;

if (code.includes(target) && !code.includes('edge-robot-script')) {
    code = code.replace(target, injection);
    fs.writeFileSync('script.js', code, 'utf8');
    console.log('✅ Injected edge-robot initialization into script.js');
} else {
    console.log('⚠️ Target already contains robot injection or not found');
}
