const Request = require('../services').request;
const _ = require('lodash');

const ProcessController = async request => {
  const seeds = _.get(request, 'body.artists', false);
  const countryCode = request.cookies[process.env.COOKIE_COUNTRY_NAME] || 'US';

  return seeds && seeds.length > 1 ? makeRequest(seeds, countryCode) : {};
}

async function makeRequest(seeds, countryCode) {
  const req = Request({ params: { country: countryCode } });
  const artistSeedInformation = seeds.map((artist) =>
    req(`/artists/${artist}/top-tracks`).then((r) => r.data, (e) => e.error)
    , []);

  const artistsTrackCollection = Promise.all(artistSeedInformation);

  const getTopTracks = await _requestBatchArtists(artistsTrackCollection);
  const getTrackStyleInformation = await _requestBatchTrackStyles(getTopTracks);
  const getRecommendations = await _requestRecommendationsFromVitals(getTopTracks, _processVitals(getTrackStyleInformation), countryCode);

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

async function _requestRecommendationsFromVitals(topTracks, recommendationModel, countryCode) {
  const req = Request({
    params: {
      limit: 100,
      market: countryCode,
      seed_tracks: _.sampleSize(topTracks, 5).join(','),
      ...recommendationModel
    }
  });

  return await req('/recommendations')
    .then(r => r.data, e => e.error);
}

async function _processVitals(tracksVitals) {
  const trackCharacteristics = [
    'acousticness',
    'danceability',
    'energy',
    'instrumentalness',
    'key',
    'liveness',
    'loudness',
    'speechiness',
    'tempo',
    'valence',
  ];

  return await _.reduce(trackCharacteristics, (res, prop) => {
    res[`max_${prop}`] = _.maxBy(tracksVitals, (t) => t[prop])[prop];
    res[`min_${prop}`] = _.minBy(tracksVitals, (t) => t[prop])[prop];
    return res;
  }, {});
}

async function _processFinalTrackList(recommendations) {
  return await !recommendations ? {} : _.chain(recommendations)
    .get('tracks', [])
    .reduce((res, track) => {
      res.push({
        trackImage: _.get(track.album, `images[${track.album.images.length - 1}].url`, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgDTD2qgAAAAASUVORK5CYII='),
        trackUri: track.uri,
        trackTitle: track.name,
        trackArtist: track.artists.map((artist) => artist.name).join(', '),
      });

      return res;
    }, [])
    .value();
}

module.exports = ProcessController;
