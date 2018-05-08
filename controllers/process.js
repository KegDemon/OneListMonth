const Request = require('../services').request;
const _ = require('lodash');

const ProcessController = async request => {
    const seeds = _.get(request, 'body.artists', false);

    return seeds && seeds.length > 1 ? makeRequest(seeds) : {};
}

async function makeRequest(seeds) {
    const req = Request({params: {country: 'US'}});
    const artistSeedInformation = seeds.map((artist) => 
        req(`/artists/${artist}/top-tracks`).then((r) => r.data, (e) => e.error)
    , []);

    const artistsTrackCollection = Promise.all(artistSeedInformation);

    const getTopTracks = await _requestBatchArtists(artistsTrackCollection);
    const getTrackStyleInformation = await _requestBatchTrackStyles(getTopTracks);
    const getRecommendations = await _requestRecommendationsFromVitals(getTopTracks, _processVitals(getTrackStyleInformation));

    return _processFinalTrackList(getRecommendations);
}

async function _requestBatchArtists(artistsTrackCollection) {
    return await artistsTrackCollection.then((artists) => {
        return _.flatten(artists.map(artistCollection => 
                artistCollection.tracks.map(track => 
                    track.id
                , [])
            , [])
        )
    });

}

async function _requestBatchTrackStyles(tracksCollection) {
    const req = Request({
        params: {
            ids: tracksCollection.join(',')
        }
    })
    return await req('/audio-features')
        .then((r) => _.get(r, 'data.audio_features', {}), (e) => e.error);
}

async function _requestRecommendationsFromVitals(topTracks, recommendationModel) {
    const req = Request({
        params: {
            limit: 100,
            market: 'US',
            seed_tracks: _.sampleSize(topTracks, 5).join(','),
            ...recommendationModel
        }
    });

    return await req('/recommendations')
        .then(r => r.data, e => e.error);
}

async function _processVitals(tracksVitals) {
    const ret = {};

    ret.max_danceability = _.maxBy(tracksVitals, (t) => t.danceability).danceability;
    ret.min_danceability = _.minBy(tracksVitals, (t) => t.danceability).danceability;

    ret.max_energy = _.maxBy(tracksVitals, (t) => t.energy).energy;
    ret.min_energy = _.minBy(tracksVitals, (t) => t.energy).energy;

    ret.max_key = _.maxBy(tracksVitals, (t) => t.key).key;
    ret.min_key = _.minBy(tracksVitals, (t) => t.key).key;

    ret.max_loudness = _.maxBy(tracksVitals, (t) => t.loudness).loudness;
    ret.min_loudness = _.minBy(tracksVitals, (t) => t.loudness).loudness;

    ret.max_speechiness = _.maxBy(tracksVitals, (t) => t.speechiness).speechiness;
    ret.min_speechiness = _.minBy(tracksVitals, (t) => t.speechiness).speechiness;

    ret.max_acousticness = _.maxBy(tracksVitals, (t) => t.acousticness).acousticness;
    ret.min_acousticness = _.minBy(tracksVitals, (t) => t.acousticness).acousticness;

    ret.max_instrumentalness = _.maxBy(tracksVitals, (t) => t.instrumentalness).instrumentalness;
    ret.min_instrumentalness = _.minBy(tracksVitals, (t) => t.instrumentalness).instrumentalness;

    ret.max_liveness = _.maxBy(tracksVitals, (t) => t.liveness).liveness;
    ret.min_liveness = _.minBy(tracksVitals, (t) => t.liveness).liveness;

    ret.max_valence = _.maxBy(tracksVitals, (t) => t.valence).valence;
    ret.min_valence = _.minBy(tracksVitals, (t) => t.valence).valence;

    ret.max_tempo = _.maxBy(tracksVitals, (t) => t.tempo).tempo;
    ret.min_tempo = _.minBy(tracksVitals, (t) => t.tempo).tempo;

    return await ret;
}

async function _processFinalTrackList(recommendations) {
    return await _.chain(recommendations)
        .get('tracks', [])
        .reduce((res, track) => {
            res.push(track.uri);

            return res;
        }, [])
        .value();
}

module.exports = ProcessController;
