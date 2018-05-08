const Request = require('../services').request;
const _ = require('lodash').get;

const BrowseController = async request => {
    const seeds = _(request, 'body.seeds', false);

    return seeds && seeds.length ? makeRequest(seeds) : {};
}

async function makeRequest(seeds) {
    const req = Request({
        params: {
            seed_artists: seeds.join(',')
        },
    });

    return await req.get('/recommendations')
        .then((r) => r.data, (e) => {
            return {error: 'Something went way wrong :('};
        });
}

module.exports = BrowseController;
