const fs = require('fs')
const path = require('path');
const https = require('https');
const express = require('express');
const helmet = require('helmet');
const passport = require('passport');
const { Strategy } = require('passport-google-oauth20');

require('dotenv').config()

const PORT = 3500;

const config = {
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
}

const AUTH_OPTIONS = {
    callbackURL: 'https://localhost:3500/auth/google/callback',
    clientID: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET
}

const verifyCallback = (accessToken, refreshToken, profile, done) => {
    console.log("Google profile", profile);
    done(null, profile);
}

passport.use(new Strategy(AUTH_OPTIONS, verifyCallback))

const app = express();

app.use(helmet());
app.use(passport.initialize());

const checkLoggedIn = (req, res, next) => {
    const isLoggedIn = true;
    if (!isLoggedIn) {
        return res.status(401).json({
            error: 'You must log in!'
        });
    }
    next();
}

app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['email'],
    }));

app.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/failure',
        successRedirect: '/',
        session: false,
    }),
    (req, res) => {
        console.log('Google called us back!')
    }
);

app.get('/auth/logout', (req, res) => {});


// Passing a middleware to this function to check if the user is logged in
// If it is not, the function will not execute
app.get('/secret', checkLoggedIn, (req, res) => {
    res.send('Your secret value is 33!')
})

app.get('/failure', checkLoggedIn, (req, res) => {
    res.send('Failed to log in!')
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