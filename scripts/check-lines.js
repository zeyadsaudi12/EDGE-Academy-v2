const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');

const lines = html.split('\n');
for (let i = 3795; i < 3885; i++) {
    console.log(`${i+1}: ${lines[i]}`);
}

