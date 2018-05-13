const express = require('express');
const router = express.Router();

const ctrl = require('../controllers');

router.get('/', (req, res) => {
    res.send('nope');
});

router.post('/browse', (req, res) => {
    ctrl.browse(req)
        .then(r => res.json(r))
});

router.post('/search', (req, res) => {
    ctrl.search(req)
        .then(r => res.json(r));
});

router.post('/process', (req, res) => {
    ctrl.process(req)
        .then(r => res.json(r));
});

router.post('/playlist', (req, res) => {
    ctrl.playlist(req)
        .then(r => res.json(r));
})

module.exports = router;
