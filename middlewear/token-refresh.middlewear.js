const axios = require('axios');
require('dotenv').config();

const cache = require('memory-cache');

const btoa = require('btoa');

const { ...env } = process.env;

const TokenRefresh = (req, res, next) => {
  // Check if a token is required
  const token = cache.get('token');

  if (token) {
    next();
    return;
  }

  async function tokenRequest() {
    console.log('Refreshing Token');
    return await axios
      .post(
        env.SPOTIFY_ACCOUNT_PATH,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${btoa(env.CLIENT_ID + ':' + env.CLIENT_SECRET)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )
      .then(function (response) {
        return response.data;
      }, (e) => {
        return void 0;
      });
  }

  tokenRequest()
    .then((data) => {
      cache.put('token', data.access_token, data.expires_in * 1000);
    })
    .then(() => {
      next();
    });

};

module.exports = TokenRefresh;
