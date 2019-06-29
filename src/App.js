import React from 'react';
import './App.css';
import QueryString from 'query-string'
import { getTokenInNewWindow, getRecommendationsBasedOnAttributes, getGenres } from './Spotify';
import GenreSelector from './GenreSelector';
import KeySelector from './KeySelector';
import { Button, InputLabel } from '@material-ui/core';
import { Slider } from '@material-ui/lab';

const formatKey = (number, isMinor) => number + (isMinor ? "B" : "A")
const stringToKey = (str) => [ parseInt(str.slice(0, -1)), (str.slice(-1).toLowerCase() === "b" ? true : false)]
const DEFAULT_TEMPO = 120
const DEFAULT_KEY_NUM = 1
const DEFAULT_KEY_IS_MINOR = false
const website = "https://www.mohancao.me/mix-companion"

const spanJoiner = (a, b) => {
  if (a.length === 0) a.push(b)
  else a.push(<br key={a.length+1}/>, b)
  return a
}

class App extends React.Component {
  constructor() {
    super()
    this.state = {
      number: DEFAULT_KEY_NUM,
      isMinor: DEFAULT_KEY_IS_MINOR,
      token: window.localStorage.getItem("token"),
      expires: window.localStorage.getItem("expires"),
      availableGenres: ['country', 'classical', 'rock', 'pop', 'blues', 'r-n-b'],
      selectedGenre: ['country'],
      results: 'Results go here',
      selectedBpm: DEFAULT_TEMPO
    }
  }

  componentDidMount() {
    /// block start
    {
      let queryParams = QueryString.parse(window.location.hash)
      if (!queryParams) return;
      let { access_token, expires_in, state } = queryParams;
      if (window.opener && window.opener.spotifyCallback) {
        window.opener.spotifyCallback(access_token, expires_in, state)
      } else if (access_token && expires_in) {
        let expiry = (new Date().getTime() + (parseInt(expires_in) * 1000 * 0.9))
        this.setNewToken(access_token, expiry) // always refresh a little earlier than needed (0.9*actual expiry time)
      }
      window.location.hash = ""
    }
    /// block end
  }

  setNewToken(token, expires) {
    if (window.localStorage.getItem("token") === token){
      return;
    } else {
      window.localStorage.setItem("token", token)
      window.localStorage.setItem("expires", expires)
      this.setState({ token: token, expires: expires })
    }
  }

  getToken() {
    getTokenInNewWindow("4a4e5068f705407480266c7e7c8d7dfa", website).then(({ token, expires }) => {
      this.setNewToken(token, expires)
    })
  }

  setKey(e) {
    const val = stringToKey(e.target.value)
    this.setState({ number: val[0] ? val[0] : DEFAULT_KEY_NUM, isMinor: val[1] ? val[1] : DEFAULT_KEY_IS_MINOR })
  }

  getGenres() {
    getGenres(this.state.token)
    .then(x => this.setState({ availableGenres: x.genres }))
    .catch(() => {
      // token failed
      this.getToken();
    })
  }

  startSearch() {
    const { token, selectedGenre, selectedBpm, number, isMinor } = this.state;
    getRecommendationsBasedOnAttributes(token, { genres: selectedGenre, bpm: selectedBpm, key: formatKey(number, isMinor)})
    .then(x => this.setState({ results: x }))
    .catch(() => {
      // token expired
      this.getToken()
    })
  }

  mapResults(results) {
    if (!results || !results.tracks || results.tracks.length < 1) return
    console.log(results.tracks.sort((a, b) => b.popularity - a.popularity))
    return results.tracks.sort((a, b) => b.popularity - a.popularity).map((track) => (
      <div key={track.id} style={{ backgroundImage: `url(${track.album ? track.album.images[0].url: ''})`, margin: 2, backgroundColor: '#999', border: '3px solid #aaa', boxSizing: 'content-box' }}>
        <div style={{ margin: 5, border: '3px solid #aaa', backgroundColor: 'rgba(0, 0, 0, 0.8)', borderRadius: '50%', height: 200, width: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 className="artist-name">{track.artists.map((art, i) => <a className="artist-name" key={i} href={art.external_urls.spotify}>{art.name}</a>).reduce(spanJoiner, [])}</h1>
          <h2 className="song-name"><a className="song-name" href={track.external_urls.spotify}>{track.name}</a></h2>
        </div>
      </div>
    ))
  }

  handleBpmChange(e, newValue) {
    if (e.shiftKey && typeof this.state.selectedBpm === 'number') newValue = [this.state.selectedBpm, newValue] 
    else if (Array.isArray(newValue) && newValue[0] === newValue[1]) newValue = newValue[0]
    console.log(newValue)
    this.setState({ selectedBpm: newValue })
  }

  render() {
    const { number, isMinor, token, results, selectedGenre, availableGenres, selectedBpm } = this.state;
    if (!token) return <div className="App"><Button onClick={() => this.getToken()}>Login to Spotify to use this app</Button></div>
    return (
      <div className="App" style={{ padding: 5 }}>
        <div style={{ backgroundColor: '#eee', padding: 15, display: 'inline-flex', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div>
              <KeySelector style={{ flexDirection: 'row', alignItems: 'center' }} camelotKey={formatKey(number, isMinor)} onChange={(e) => this.setKey(e)} />
              <GenreSelector style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 5 }} selectedGenre={selectedGenre} availableGenres={availableGenres} onChange={(e) => this.setState(e)} onRefreshClicked={() => this.getGenres()} />
            </div>
            <div style={{ marginTop: 5 }}>
              <Button style={{ width: '100%' }} color="primary" variant="contained" onClick={() => this.startSearch()}>Start search</Button>
            </div>
          </div>
          <div>
            <InputLabel style={{ width: '100%' }} shrink htmlFor="bpm">BPM</InputLabel>
            <div style={{ display: 'flex', height: 75 }}>
              <Slider
                name="bpm"
                orientation="vertical"
                min={0}
                max={300}
                value={selectedBpm}
                onChange={(e, newValue) => this.handleBpmChange(e, newValue)}
                valueLabelDisplay="auto"
              />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          {this.mapResults(results)}
        </div>
      </div>
    );
  }
}

export default App;
