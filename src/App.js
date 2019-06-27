import React from 'react';
import './App.css';
import QueryString from 'query-string'
import { getTokenInNewWindow, getRecommendationsBasedOnAttributes, getGenres } from './Spotify';

const formatKey = (number, isMinor) => number + (isMinor ? "B" : "A")
const stringToKey = (str) => [ parseInt(str.slice(0, -1)), (str.slice(-1).toLowerCase() === "b" ? true : false)]
const DEFAULT_TEMPO = 120
const DEFAULT_KEY_NUM = 1
const DEFAULT_KEY_IS_MINOR = false
const website = "https://www.mohancao.me/mix-companion"

const camelotMinorKey = [
  "1A",    
  "2A",    
  "3A",    
  "4A",    
  "5A",    
  "6A",    
  "7A",    
  "8A",    
  "9A",    
  "10A",   
  "11A",   
  "12A",
]

const camelotMajorKey = [
  "1B", 
  "2B", 
  "3B", 
  "4B", 
  "5B", 
  "6B", 
  "7B", 
  "8B", 
  "9B", 
  "10B",
  "11B",
  "12B",
]

const spanJoiner = (a, b) => {
  if (a.length === 0) a.push(b)
  else a.push(', ', b)
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
      bpmSearch: DEFAULT_TEMPO,
      availableGenres: ['country', 'classical', 'rock', 'pop', 'blues', 'r-n-b'],
      selectedGenre: 'country',
      results: 'Results go here',
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
    const { token, selectedGenre, bpmSearch, number, isMinor } = this.state;
    getRecommendationsBasedOnAttributes(token, { genres: selectedGenre, bpm: bpmSearch, key: formatKey(number, isMinor)})
    .then(x => this.setState({ results: x }))
    .catch(() => {
      // token expired
      this.getToken()
    })
  }

  mapResults(results) {
    if (!results || !results.tracks || results.tracks.length < 1) return
    return results.tracks.map((track, i) => (
      <div key={i}>
        <h1>{track.artists.map((art, i) => <a key={i} href={art.external_urls.spotify}>{art.name}</a>).reduce(spanJoiner, [])}</h1>
        <h2><a href={track.external_urls.spotify}>{track.name}</a></h2>
      </div>
    ))
  }

  render() {
    const { number, isMinor, token, results, selectedGenre, availableGenres } = this.state;
    if (!token) return <button onClick={this.getToken}>Login to Spotify to use this app</button>
    return (
      <div className="App">
        <h1>{formatKey(number, isMinor)}</h1>
        <div>
          <label htmlFor="key">Enter key: </label>
          <select name="key" value={formatKey(number, isMinor)} onChange={(e) => this.setKey(e)}>
            <optgroup label="Minor keys">{camelotMinorKey.map((x) => <option key={x} value={x}>{x}</option>)}</optgroup>
            <optgroup label="Major keys">{camelotMajorKey.map((x) => <option key={x} value={x}>{x}</option>)}</optgroup>
          </select>
        </div>
        <div>
          <label htmlFor="bpm">Enter BPM: </label><input type="number" defaultValue={DEFAULT_TEMPO} name="bpm" onChange={(e) => this.setState({ bpmSearch: parseFloat(e.target.value ? e.target.value : DEFAULT_TEMPO) })} />
        </div>
        <div>
          <select value={selectedGenre} onChange={(e) => this.setState({ selectedGenre: e.target.value })}>
            {(availableGenres && availableGenres.length > 0 ?
              availableGenres.map((x) => <option key={x} value={x}>{x}</option>)
              :
              <option>No genres available</option>
            )}
          </select>
          <button onClick={() => this.getGenres()}>Fetch all genres</button>
        </div>
        <div>
          <button onClick={() => this.startSearch()}>Start search</button>
        </div>
        <div>
          {this.mapResults(results)}
        </div>
      </div>
    );
  }
}

export default App;
