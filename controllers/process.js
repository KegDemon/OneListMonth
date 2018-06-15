require('dotenv').config();

const Request = require('../services').request;
const _ = require('lodash');

const { ...env } = process.env;

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
  });

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
  const trackCharacteristics = env.SPOTIFY_TRACK_CHARACTERISTICS.split(',');
  const trackIgnoreVariances = env.SPOTIFY_TRACK_IGNORE_VARIANCES.split(',');
  const trackVarianceMax = env.SPOTIFY_TRACK_VARIANCE_MAX > 0 ? env.SPOTIFY_TRACK_VARIANCE_MAX : 0;

  return await _.reduce(trackCharacteristics, (res, prop) => {
    let _max = void 0;
    let _min = void 0;

    _max = _.maxBy(tracksVitals, (t) => t[prop])[prop] * 100;
    _min = _.minBy(tracksVitals, (t) => t[prop])[prop] * 100;

    if (
      trackVarianceMax
      && (trackIgnoreVariances.indexOf(prop) < 0)
      && (_max - _min > trackVarianceMax)
    ) {
      const varianceToModify = ((_max - _min) / 2) - (trackVarianceMax / 2);

      _max = (_max - varianceToModify);
      _min = (_min + varianceToModify);
    }

    res[`max_${prop}`] = +(_max / 100).toFixed(4);
    res[`min_${prop}`] = +(_min / 100).toFixed(4);

    return res;
  }, {});
}

async function _processFinalTrackList(recommendations) {
  return await !recommendations ? [] : _.chain(recommendations)
    .get('tracks', [])
    .reduce((res, track) => {
      res.push({
        trackImage: _.get(
          track.album,
          `images[${track.album.images.length - 1}].url`,
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgDTD2qgAAAAASUVORK5CYII='
        ),
        trackUri: track.uri,
        trackTitle: track.name,
        trackArtist: track.artists.map((artist) => artist.name).join(', '),
      });

      return res;
    }, [])
    .value();
}

module.exports = ProcessController;
