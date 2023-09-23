const fs = require('fs')
const path = require('path');
const https = require('https');
const express = require('express');
const helmet = require('helmet');

const PORT = 3500;

const app = express();

app.use(helmet())

app.get('/secret', (req, res) => {
    res.send('Your secret value is 33!')
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
}, app).listen(PORT, () => {
    console.log(`Listening on port:`, PORT)
})