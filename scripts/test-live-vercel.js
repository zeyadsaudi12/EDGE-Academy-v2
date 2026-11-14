const https = require('https');

// Point this at a local or staging deployment. There is deliberately no
// default production URL so a test run cannot hit live users by accident.
const baseUrl = process.env.LIVE_BASE_URL;
if (!baseUrl) {
    console.error('Set LIVE_BASE_URL (for example http://localhost:3000) before running this check.');
    process.exit(1);
}

const target = new URL('/api/play-study/admin/players', baseUrl);
const client = target.protocol === 'http:' ? require('http') : https;

client.get(target, (res) => {
    let data = '';
    console.log('Status code:', res.statusCode);
    console.log('Headers:', res.headers);
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Body length:', data.length);
        console.log('Body snippet:', data.substring(0, 500));
        if (res.statusCode !== 401 && res.statusCode !== 403) {
            console.error('Expected the admin endpoint to reject an anonymous request.');
            process.exitCode = 1;
        }
    });
}).on('error', (err) => {
    console.error('Fetch error:', err.message);
    process.exitCode = 1;
});
