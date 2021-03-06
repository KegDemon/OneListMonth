require('dotenv').config();

const express = require('express');
const router = express.Router();
const uuid = require('uuid/v1');
const axios = require('axios');

const userCookieOpts = {
  maxAge: 1000 * 60 * process.env.COOKIE_LOGIN_EXPIRY,
  httpOnly: true,
  secure: process.env.COOKIE_SECURE || false
};

router.get('/login', (req, res, next) => {
  const stateRequest = uuid();
  res.cookie(process.env.COOKIE_XSRF_NAME, stateRequest, { maxAge: 1000 * 60 * process.env.COOKIE_XSRF_TIMEOUT });

  res.redirect(`${process.env.SPOTIFY_LOGIN_PATH}?client_id=${process.env.CLIENT_ID}&response_type=token&scope=playlist-modify-public%20user-read-private&state=${stateRequest}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URL)}`)
});

router.get('/auth', (req, res, next) => {
  const token = req.query.access_token || -1;
  const checkXsrf = req.query.state === req.cookies[process.env.COOKIE_XSRF_NAME];

  res.cookie(process.env.COOKIE_XSRF_NAME, -1, {
    maxAge: 1
  });

  if (!checkXsrf) {
    res.redirect(process.env.SERVER_ORIGIN);
    return;
  }

  if (!req.cookies[process.env.COOKIE_LOGIN_NAME]) {
    res.cookie(process.env.COOKIE_LOGIN_NAME, token, userCookieOpts);
  }

  res.redirect('/');
});

router.get('/loggedin', (req, res) => {
  res.send(!!(req.cookies[process.env.COOKIE_LOGIN_NAME]));
});

router.get('/user', (req, res) => {
  const uToken = req.cookies[process.env.COOKIE_LOGIN_NAME];
  const uCookie = req.cookies[process.env.COOKIE_UID_NAME];
  const uCountry = req.cookies[process.env.COOKIE_COUNTRY_NAME];
  if (!uToken || uCookie || uCountry) {
    res.redirect('/');
    return;
  }

  axios.get(`${process.env.SPOTIFY_BASE_PATH}/me`, {
    headers: {
      Authorization: `Bearer ${uToken}`
    }
  })
  .then((r) => {
    res.cookie(process.env.COOKIE_UID_NAME, r.data.id, userCookieOpts)
    res.cookie(process.env.COOKIE_COUNTRY_NAME, r.data.country, userCookieOpts)

    res.redirect('/');
  }, (e) => e.error);

});

module.exports = router;
