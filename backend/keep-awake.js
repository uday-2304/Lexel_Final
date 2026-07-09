const https = require('https');

setInterval(() => {
  https.get('https://lexel-backend.onrender.com/', (res) => {
    console.log(`Ping successful, status: ${res.statusCode}`);
  }).on('error', (e) => {
    console.error(`Ping failed: ${e.message}`);
  });
}, 30000); // Ping every 30 seconds

console.log('Keeping Render awake...');
