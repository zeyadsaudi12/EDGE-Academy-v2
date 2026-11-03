const fs = require('fs');
let css = fs.readFileSync('style.css', 'utf8');

css = css.replace(
    /\.nav-link-item\s*\{\s*font-size:\s*0\.94rem;\s*padding:\s*8px 15px;\s*color:\s*var\(--text-dark\);\s*text-decoration:\s*none;\s*font-weight:\s*700;\s*font-size:\s*1rem;\s*padding:\s*10px 20px;\s*border-radius:\s*999px;\s*transition:\s*all 0\.22s cubic-bezier\(0\.16, 1, 0\.3, 1\);\s*position:\s*relative;\s*white-space:\s*nowrap;\s*\}/,
    `.nav-link-item {
    color: var(--text-dark);
    text-decoration: none;
    font-weight: 700;
    font-size: 0.94rem;
    padding: 8px 15px;
    border-radius: 999px;
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    white-space: nowrap;
}`
);

fs.writeFileSync('style.css', css, 'utf8');
console.log('✅ Cleaned up .nav-link-item in style.css');

