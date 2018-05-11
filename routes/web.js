require('dotenv').config();

const express = require('express');
const router = express.Router();
const uuid = require('uuid/v1');
const axios = require('axios');
const ctrl = require('../controllers');

router.get('/login', (req, res, next) => {
    const stateRequest = uuid();
    res.cookie(process.env.COOKIE_XSRF_NAME, stateRequest, {maxAge: 1000 * 60});

    res.redirect(`${process.env.SPOTIFY_LOGIN_PATH}?client_id=${process.env.CLIENT_ID}&response_type=token&scope=playlist-modify-public&state=${stateRequest}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URL)}`)
});

router.get('/auth', (req, res, next) => {
    const token = req.query.access_token || -1;
    const checkXsrf = req.query.state === req.cookies[process.env.COOKIE_XSRF_NAME];

    res.cookie(process.env.COOKIE_XSRF_NAME, -1, {
        maxAge: 1
    });

    if (!checkXsrf) {
        res.redirect('https://www.youtube.com/watch?v=6eW_Xw6L05M');
        return;
    }

    if (!req.cookies[process.env.COOKIE_LOGIN_NAME]) {
        const cookieOptions = {
            maxAge: 1000 * 60 * process.env.COOKIE_LOGIN_EXPIRY,
            httpOnly: true
        };
    
        res.cookie(process.env.COOKIE_LOGIN_NAME, token, cookieOptions);
    }

    res.redirect('/');
});

module.exports = router;
