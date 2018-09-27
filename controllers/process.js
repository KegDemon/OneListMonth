require('dotenv').config();

const Request = require('../services').request;
const _ = require('lodash');

const { ...env } = process.env;

const ProcessController = async request => {
  const seeds = _.get(request, 'body.artists', false);
  const countryCode = request.cookies[process.env.COOKIE_COUNTRY_NAME] || 'US';

  return seeds && seeds.length > 1 ? makeRequest(seeds, countryCode) : {};
}

async function makeRequest(artistSeeds, countryCode) {
  const req = Request({ params: { country: countryCode } });
  const artistSeedInformation = artistSeeds.map((artist) =>
    req(`/artists/${artist}/top-tracks`).then((r) => r.data, (e) => e.error),
    []
  );

  const artistsTrackCollection = Promise.all(artistSeedInformation);

  const getTopTracks = await _requestBatchArtists(artistsTrackCollection);
  const getTrackStyleInformation = await _requestBatchTrackStyles(getTopTracks);
  const getRecommendations = await _requestRecommendationsFromVitals(
    getTopTracks,
    artistSeeds,
    _processVitals(getTrackStyleInformation),
    countryCode
  );

  const results = {...getRecommendations};

  if (env.SPOTIFY_TRACK_GENERATION_ADDITIONS > 0) {
    for (let i = 0; i < env.SPOTIFY_TRACK_GENERATION_ADDITIONS; ++i) {
      const _res = await _requestAdditionalTracks(
        !i ? getRecommendations : {tracks: results.tracks.slice(-10)},
        countryCode
      );
      results.tracks.push(..._res);
    }
  }

  return _processFinalTrackList(results);
}

async function _requestAdditionalTracks(recommendations, countryCode) {
  if ('object' !== typeof recommendations
    || (!recommendations.tracks && !recommendations.tracks.length)
  ) return [];

  const bottomResults = recommendations.tracks;
  const bottomResultsTrackIds = bottomResults.map(track => track.id);
  const bottomResultsTrackStyles = await _requestBatchTrackStyles(bottomResultsTrackIds).then(_processVitals);
  const bottomResultsParsed = await _requestRecommendationsFromVitals(
    bottomResultsTrackIds,
    [],
    bottomResultsTrackStyles,
    countryCode
  );

  return await bottomResultsParsed.tracks;
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

async function _requestRecommendationsFromVitals(topTracks, artistSeeds, recommendationModel, countryCode) {
  const params = {
    limit: env.SPOTIFY_TRACK_REQUEST_SIZE > 0 ? env.SPOTIFY_TRACK_REQUEST_SIZE : 100,
    market: countryCode,
    seed_artists: artistSeeds.join(','),
    ...recommendationModel
  };

  if (artistSeeds.length < 5) {
    params.seed_tracks = _.sampleSize(topTracks, 5 - artistSeeds.length).join(',');
  }

  const req = Request({ params });

  return await req('/recommendations')
    .then(r => r.data, e => e.error);
}

function _processVitals(tracksVitals) {
  const trackCharacteristics = env.SPOTIFY_TRACK_CHARACTERISTICS.split(',');
  const trackIgnoreVariances = env.SPOTIFY_TRACK_IGNORE_VARIANCES.split(',');
  const trackVarianceMax = env.SPOTIFY_TRACK_VARIANCE_MAX > 0 ? env.SPOTIFY_TRACK_VARIANCE_MAX : 0;

  return _.reduce(trackCharacteristics, (res, prop) => {
    let _max = void 0;
    let _min = void 0;

    _max = _.maxBy(tracksVitals, (t) => t[prop])[prop] * 100;
    _min = _.minBy(tracksVitals, (t) => t[prop])[prop] * 100;

    const diff = (_max - _min) / 2;

    if (
      trackVarianceMax > 0
      && (trackIgnoreVariances.indexOf(prop) < 0)
      && (_max - _min > trackVarianceMax)
    ) {
      const varianceToModify = ((_max - _min) / 2) - (trackVarianceMax / 2);

      _max = (_max - varianceToModify);
      _min = (_min + varianceToModify);
    }

    if ((trackIgnoreVariances.indexOf(prop) < 0)) {
      res[`target_${prop}`] = +(diff / 100).toFixed(4);
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
    .filter('trackUri')
    .value();
}

module.exports = ProcessController;
