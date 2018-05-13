require('dotenv').config();
const axios = require('axios');
const _ = require('lodash');

const { ...env } = process.env;

let _uid = void 0;
let _utoken = void 0;

const Request = (params) => axios.create({
  baseURL: `${env.SPOTIFY_BASE_PATH}/users/${_uid}/playlists`,
  headers: {
    Authorization: `Bearer ${_utoken}`,
    'Content-Type': 'application/json'
  },
  method: 'post',
  ...params
})

const PlaylistController = async request => {
  const _playlist = _.get(request, 'body.playlist', void 0);

  _uid = request.cookies[env.COOKIE_UID_NAME];
  _utoken = request.cookies[env.COOKIE_LOGIN_NAME];

  if (!_playlist || !_uid || !_utoken) return await {data: 'error'};

  const _trackIds = _playlist.map((track) => track.trackUri);

  const _newCreatedPlaylistId = await _putPlaylist();

  return await _putPlaylistItems(_newCreatedPlaylistId, _trackIds);
}

async function _putPlaylist() {
  const req = Request({
    data: {
      name: `OneListMonth - ${new Date()}`,
      description: 'Created with OneListMonth'
    }
  });

  return await req('')
    .then(
      (r) => _.get(r, 'data.id', -1),
      (e) => e.error
    );
}

async function _putPlaylistItems(playlistId, trackIds) {
  if (playlistId < 0) {
    return await {data: "Error creating playlist"};
  }
  
  const req = Request({
    data: {
      uris: trackIds
    }
  });

  return await req(`/${playlistId}/tracks`)
    .then(
      (r) => r.data,
      (e) => e.error
    );
}

module.exports = PlaylistController;
