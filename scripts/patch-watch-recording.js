const fs = require('fs');
let watchHtml = fs.readFileSync('watch.html', 'utf8');

// When video is verified and loaded, send an asynchronous signal to mark video as watched for Play & Study
const markWatchedCall = `
            // ── تسجيل استماع ومشاهدة المحاضرة لتفعيل أسئلتها في Play & Study ──
            if (!isAdmin && currentUser && currentUser._id && currentVideoId) {
                fetch('/api/play-study/mark-watched', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUser._id, videoId: currentVideoId })
                }).catch(err => console.error('Failed to mark video watched for Play & Study:', err));
            }
`;

if (!watchHtml.includes('/api/play-study/mark-watched')) {
    watchHtml = watchHtml.replace(
        `document.getElementById('videoTitle').textContent = video.title;`,
        `${markWatchedCall}\n            document.getElementById('videoTitle').textContent = video.title;`
    );
    fs.writeFileSync('watch.html', watchHtml, 'utf8');
    console.log('✅ Injected mark-watched API call in watch.html');
} else {
    console.log('ℹ️ mark-watched already present in watch.html');
}

