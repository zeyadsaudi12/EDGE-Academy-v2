const fs = require('fs');

let html = fs.readFileSync('admin.html', 'utf8');

const target = `                <td style="padding:14px 18px; font-weight:700; color:var(--txt2);">
                    🥇 \${p.perfectWins} مرة
                </td>`;

const replacement = `                <td style="padding:14px 18px; font-weight:700; color:var(--txt2);">
                    <div>🥇 \${p.perfectWins} مرة</div>
                    <small style="color:#0ea5e9; font-weight:800; display:inline-flex; align-items:center; gap:4px; margin-top:3px;">
                        🤖 روبوت EDGE: \${p.edgeRobotFinds || 0}
                    </small>
                </td>`;

if (html.includes(target)) {
    html = html.replace(target, replacement);
    fs.writeFileSync('admin.html', html, 'utf8');
    console.log('✅ Added EDGE robot stat badge to admin table');
}

