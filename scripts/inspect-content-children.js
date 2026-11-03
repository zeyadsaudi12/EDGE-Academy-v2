const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');

const contentStart = html.indexOf('<div class="content">');
const mainEnd = html.indexOf('</main>');
const contentHtml = html.substring(contentStart, mainEnd);

const regex = /<div\s+([^>]*id="[^"]*"[^>]*)>/g;
let m;
while ((m = regex.exec(contentHtml)) !== null) {
    if (m[1].includes('section-') || m[1].includes('id="')) {
        console.log(m[1]);
    }
}

