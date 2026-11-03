const fs = require('fs');
let html = fs.readFileSync('play-study.html', 'utf8');

const oldFetchBlock = `            const res = await fetch(\`/api/play-study/profile?userId=\${encodeURIComponent(userId)}\`);
            const json = await res.json();
            if (json.success) {`;

const newFetchBlock = `            const res = await fetch(\`/api/play-study/profile?userId=\${encodeURIComponent(userId)}\`);
            const json = await res.json();
            
            // Anti-Cheat Ban Detection:
            if (res.status === 403 || json.isBanned) {
                Swal.fire({
                    icon: 'error',
                    title: '🚫 تم إيقاف اللعبة وحسابك محظور',
                    text: json.message || 'لقد تم حظرك بسبب الغش!',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    showConfirmButton: true,
                    confirmButtonText: 'العودة للرئيسية',
                    confirmButtonColor: '#e11d48'
                }).then(() => {
                    window.location.href = '/';
                });
                document.querySelector('.ps-container').innerHTML = \`
                    <div style="grid-column:1/-1; background:#fee2e2; border:2px solid #ef4444; border-radius:20px; padding:40px; text-align:center; color:#991b1b;">
                        <i class="fas fa-ban" style="font-size:3.5rem; margin-bottom:16px;"></i>
                        <h2 style="margin:0 0 10px; font-weight:900;">لقد تم حظرك بسبب الغش!</h2>
                        <p style="margin:0; font-size:1.1rem; font-weight:700;">\${json.message}</p>
                    </div>
                \`;
                return;
            }

            if (json.success) {`;

if (html.includes(oldFetchBlock)) {
    html = html.replace(oldFetchBlock, newFetchBlock);
    fs.writeFileSync('play-study.html', html, 'utf8');
    console.log('✅ Added anti-cheat ban alert and lock screen to play-study.html');
} else {
    console.error('❌ Could not find oldFetchBlock in play-study.html');
}

