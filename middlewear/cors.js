require('dotenv').config();
const express = require('express');
const cors = express();

cors.use((req, res, next) => {
  const permittedOrigin = process.env.SERVER_ORIGIN.split(',').indexOf(req.headers.origin) > -1;

  if (!permittedOrigin) {
    console.log(`Invalid request from: ${req.headers.origin || 'Unknown'}`);

    res.status(400);
    return res.json({error: 'invalid server origin'})
  };

  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

module.exports = cors;
