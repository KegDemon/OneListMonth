require('dotenv').config();

const express = require('express');
const app = express();
const middlewear = require('./middlewear');
const routes = require('./routes');
const port = process.env.RUN_PORT || 1337;

app.use(middlewear.tokenRefresh);
app.use(express.json())

app.use('/', routes);

app.listen(port, () => {
    console.log('Booting up...');
});
