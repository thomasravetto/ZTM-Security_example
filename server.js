const fs = require('fs')
const path = require('path');
const https = require('https');
const express = require('express');
const helmet = require('helmet');
const passport = require('passport');
const { Strategy } = require('passport-google-oauth20');
const cookieSession = require('cookie-session')

require('dotenv').config()

const PORT = 3500;

const config = {
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    COOKIE_KEY_1: process.env.COOKIE_KEY_1,
    COOKIE_KEY_2: process.env.COOKIE_KEY_2,
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

// Save session to cookie
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Read session from cookie
passport.deserializeUser((id, done) => {
    done(null, id);
})

const app = express();

app.use(helmet());

app.use(cookieSession({
    name: 'session',
    maxAge: 24 * 60 * 60 * 1000, // One 24 hours day
    keys: [config.COOKIE_KEY_1, config.COOKIE_KEY_2]
}))

app.use(passport.initialize());
app.use(passport.session());

const checkLoggedIn = (req, res, next) => {
    const isLoggedIn = req.isAuthenticated() && req.user;
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
        session: true,
    }),
    (req, res) => {
        console.log('Google called us back!')
    }
);

app.get('/auth/logout', (req, res) => {
    req.logout(); // Removes req.user and clears session
    return res.redirect('/');
});


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