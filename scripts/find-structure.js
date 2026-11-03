const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');

const lines = html.split('\n');
lines.forEach((l, i) => {
    if (l.includes('class="content"') || l.includes('id="section-')) {
        console.log(`${i+1}: ${l.trim()}`);
    }
});

