const https = require('https');

https.get('https://edgeacademy-blush.vercel.app/api/play-study/admin/players', (res) => {
    let data = '';
    console.log('Status code:', res.statusCode);
    console.log('Headers:', res.headers);
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Body length:', data.length);
        console.log('Body snippet:', data.substring(0, 500));
    });
}).on('error', (err) => {
    console.error('Fetch error:', err.message);
});

