require('dotenv').config();

const express = require('express');
const cookies = require('cookie-parser');
const app = express();
const middlewear = require('./middlewear');
const routes = require('./routes');
const port = process.env.RUN_PORT || 1337;

app.use(express.json())
app.use(cookies());

app.use('/', routes.webRoutes);

app.use('/api', middlewear.tokenRefresh, routes.apiRoutes);

app.use(express.static('public'));

app.listen(port, () => {
    console.log('Booting up...');
});
