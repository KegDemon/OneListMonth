new Vue({
  el: '#app',
  data: () => {
    return {
      artistResults: [],
      generatedPlaylist: [],
      isLoggedIn: void 0,
      loadingPlaylist: void 0,
      playlistDialog: void 0,
      searchDebounce: void 0,
      searchingArtist: void 0,
      searchTerm: void 0,
      selectedArtists: [],
    }
  },
  created: function() {
    axios.get('loggedin')
        .then((r) => {
          this.isLoggedIn = r.data;

          return r.data;
        })
        .then((d) => {
          if (!d) return;

          axios.get('user');
        });
  },
  watch: {
    searchTerm (val) {
      window.clearTimeout(this.searchDebounce);

      if (!val || val.length < 2) {
        this.artistResults = new Array();
        return;
      }

      this.searchDebounce = setTimeout(() => {
        this.artistLookup(val);
      }, 500);
    }
  },
  methods: {
    generatePlaylist () {
      if (this.selectedArtists.length > 5 || this.selectedArtists.length < 2 ) {
        this.playlistDialog = false;
        return;
      }

      this.loadingPlaylist = true;

      axios.post('api/process', {
        artists: this.selectedArtists.map((artist) => artist.id),
      })
      .then((r) => {
        this.generatedPlaylist = r.data;
        this.loadingPlaylist = void 0;
      });
    },
    savePlaylist () {
      axios.post('api/playlist',
        {
          playlist: this.generatedPlaylist,
          seedArtists: this.selectedArtists
            .map((artist) => artist.name)
            .join(', '),
        }
      );
    },
    artistLookup (val) {
      this.searchingArtist = true;
      this.artistResults = new Array();

      axios.post('api/search', { artist: val })
        .then((results) => {
          this.artistResults = [].concat(results.data);
        })
        .finally(() => {
          this.searchingArtist = void 0;
        });
    }
  }
});
