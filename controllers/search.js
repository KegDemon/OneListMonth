const Request = require('../services').request;
const _ = require('lodash').get;

const SearchController = async request => {
    const search = _(request, 'body.artist', false);

    return search ? makeRequest(search) : {};
}

async function makeRequest(input) {
    const req = Request({
        params: {
            q: input,
            type: 'artist',
            limit: 10
        },
    });

    return await req('/search')
        .then((r) => r.data, (e) => {
            return {error: 'Something went way wrong :('};
        });
}

module.exports = SearchController;
