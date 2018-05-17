require('dotenv').config();
const BASE_PATH = process.env.SPOTIFY_BASE_PATH;

const axios = require('axios');
const cache = require('memory-cache');

const Request = (params) => {
  return axios.create({
    baseURL: BASE_PATH,
    headers: {
      Authorization: `Bearer ${cache.get('token')}`
    },
    ...params
  });
};

module.exports = Request;
