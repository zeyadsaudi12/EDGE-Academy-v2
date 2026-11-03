const fs = require('fs');
let h = fs.readFileSync('profile.html', 'utf8');

h = h.replace('<div class="shape s2"></div><div class="shape s3"></div>\r\n</div>', '');
h = h.replace('<div class="shape s2"></div><div class="shape s3"></div>\n</div>', '');
h = h.replace(/<div class="shape s2">[\s\S]*?<\/div>\s*<\/div>/, '');

fs.writeFileSync('profile.html', h, 'utf8');
console.log('✅ Removed completely!');

