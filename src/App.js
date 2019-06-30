import React from 'react';
import './App.css';
import QueryString from 'query-string'
import { getTokenInNewWindow, getRecommendationsBasedOnAttributes, getGenres } from './Spotify';
import GenreSelector from './GenreSelector';
import KeySelector from './KeySelector';
import { Button } from '@material-ui/core';
import BPMSlider from './BPMSlider';
import SearchBar from './SearchBar';
import ResizableFlexbox from './ResizableFlexbox';
import Results from './Results';
import ErrorSnackbar from './ErrorSnackbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpotify } from '@fortawesome/free-brands-svg-icons'

const formatKey = (number, isMinor) => number + (isMinor ? "B" : "A")
const stringToKey = (str) => [ parseInt(str.slice(0, -1)), (str.slice(-1).toLowerCase() === "b" ? true : false)]
const DEFAULT_TEMPO = 120
const DEFAULT_KEY_NUM = 1
const DEFAULT_KEY_IS_MINOR = false
const website = "https://www.mohancao.me/mix-companion"

export const spanJoiner = (a, b) => {
  if (a.length === 0) a.push(b)
  else a.push(<br key={a.length+1}/>, b)
  return a
}

const rotateNumber = (a, b) => (prev, amount) => {
  amount = prev + amount;
  amount %= (b - a + 1);
  if (amount < a) amount += b
  return amount
}

const rotate12 = rotateNumber(1, 12)

function compressSearchTerms({ selectedBpm, number, isMinor, type, query }) {
  return btoa(JSON.stringify([ selectedBpm, number, isMinor, type, query ]))
}

function decompressSearchTerms(base64) {
  try {
    const arr = JSON.parse(atob(base64))
    if ((!Array.isArray(arr[0]) && typeof arr[0] !== 'number')) return {}
    if (typeof arr[1] !== 'number' || arr[1] < 1 || arr[1] > 12) return {}
    if ((!Array.isArray(arr[3]) && typeof arr[3] !== 'string')) return {}
    if (!Array.isArray(arr[4]) && typeof arr[4] !== 'string') return {}
    return { selectedBpm: arr[0], number: parseInt(arr[1]), isMinor: !!arr[2], type: arr[3], query: arr[4] }
  } catch (e) {
    console.error(e)
    return {}
  }
}

function handleSpotifyCallback(access_token, expires_in, nonce) {
  if (window.opener && window.opener.spotifyCallback) {
    try {
      window.opener.spotifyCallback(access_token, expires_in, nonce)
    } catch (e) {
      // we're in local development. don't do anything lol
      this.setNewToken(access_token, expires_in);
    }
    return true;
  } else {
    return false;
  }
}

function handleLocationQueryChanges() {
  let queryParams = QueryString.parse(window.location.hash)
  if (!queryParams) return;
  let { access_token, expires_in, state } = queryParams;
  if (handleSpotifyCallback(access_token, expires_in, state)) {}
  // Handle tokens
  else if (access_token && expires_in) {
    let expiry = (new Date().getTime() + (parseInt(expires_in) * 1000 * 0.9))
    this.setNewToken(access_token, expiry) // always refresh a little earlier than needed (0.9*actual expiry time)
  } else {
    const token = window.localStorage.getItem("token")
    const expires = window.localStorage.getItem("expires")
    if (new Date().getTime() < parseInt(expires)) {
      this.setState({ token, expires })
    }
  }
  window.history.replaceState(null, null, ' ');

  // Handle bookmarked searches and history
  const searchParam = queryParams["search"]
  if (searchParam) {
    const searchTerms = decompressSearchTerms(searchParam)
    if (Object.keys(searchTerms).length > 0) {
      console.log(searchTerms)
      this.setState(searchTerms, () => this.state.token && this.startSearch())
      window.location.hash += (window.location.hash ? "&search=" : "search=") + searchParam
    }
  }
}

class App extends React.Component {
  constructor() {
    super()
    this.state = {
      number: DEFAULT_KEY_NUM,
      isMinor: DEFAULT_KEY_IS_MINOR,
      token: null,
      expires: 0,
      availableGenres: ['country', 'classical', 'rock', 'pop', 'blues', 'r-n-b'],
      results: null,
      selectedBpm: DEFAULT_TEMPO,
      type: "Track",
      query: "",
    }
  }

  componentDidMount() {
    /// block start
    handleLocationQueryChanges.bind(this)()
    /// block end
  }

  setNewToken(token, expires) {
    if (window.localStorage.getItem("token") === token){
      return;
    } else {
      window.localStorage.setItem("token", token)
      window.localStorage.setItem("expires", expires)
      this.setState({ token: token, expires: new Date().getTime() + expires })
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
    .catch((code) => {
      // token expired
      if (code === 401) this.getToken();
      else this.setState({ error: ''+code });
    })
  }

  startSearch() {
    const { token, selectedBpm, number, isMinor, type, query } = this.state;

    let errors = ''
    if (type === "Genre" && query && query.length && query.length > 5) errors += "Sorry, can't have more than 5 genres. "
    if (errors) { this.setState({ error: errors }); return; }

    getRecommendationsBasedOnAttributes(token, {
      genres: (type === 'Genre' ? query : null),
      bpm: selectedBpm,
      key: [formatKey(number, isMinor), formatKey(rotate12(number, -1), isMinor), formatKey(rotate12(number, 1), isMinor), formatKey(number, !isMinor)],
      songs: (type === 'Track' ? query.split(',').map(x => x.trim()) : null),
      artist: (type === 'Artist' ? query.split(',').map(x => x.trim()) : null),
    })
    .then(x => {
      const hashObj = QueryString.parse(window.location.hash)
      hashObj["search"] = compressSearchTerms({ selectedBpm, number, isMinor, type, query })
      window.location.hash = QueryString.stringify(hashObj)
      this.setState({ results: x })
    })
    .catch((code) => {
      // token expired
      if (code === 401) this.getToken()
      else this.setState({ error: ''+code })
    })
  }

  handleBpmChange(e, newValue) {
    if (e.shiftKey && typeof this.state.selectedBpm === 'number') newValue = [this.state.selectedBpm, newValue] 
    else if (Array.isArray(newValue) && newValue[0] === newValue[1]) newValue = newValue[0]
    this.setState({ selectedBpm: newValue })
  }

  handleSongClick(song, artist) {
    this.setState({ type: "Track", query: song.name + " (" + artist.name + ")"})
  }

  handleArtistClick(artist) {
    this.setState({ type: "Artist", query: artist.name })
  }

  setSearchTerms({ query, type }) {
    if (type) {
      this.setState({ type, query: '' })
    } else {
      this.setState({ query })
    }
  }

  render() {
    const { number, isMinor, token, results, availableGenres, selectedBpm, type, query, error } = this.state;
    if (!token) return (
      <div className="App" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Button variant="outlined" onClick={() => this.getToken()} className="loginBtn"><FontAwesomeIcon icon={faSpotify} style={{ marginRight: 5 }} />Login to Spotify to use this app</Button>
      </div>
    )
    return (
      <div className="App">
        <ErrorSnackbar open={!!error} error={error} onClose={() => this.setState({ error: null })} />
        <div className="search">
          <div style={{ display: 'flex', flexDirection: 'column', width: '70%', flex: '1 1 auto', overflow: 'auto' }}>
            <div style={{ display: 'flex' }}>
              <KeySelector style={{ flexDirection: 'row', flex: '0 0 auto', alignItems: 'center' }} camelotKey={formatKey(number, isMinor)} onChange={(e) => this.setKey(e)} />
              <SearchBar style={{ flexDirection: 'row', flex: '1 1 150px', minWidth: '150px', alignItems: 'center', marginLeft: 5 }}
                         type={type}
                         value={query}
                         onChange={(e) => this.setSearchTerms(e)}
                         GenreSelector={<GenreSelector
                                         style={{ flexDirection: 'row', flex: '1 1 auto', alignItems: 'center', marginLeft: 5 }}
                                         selectedGenre={type === 'Genre' && Array.isArray(query) ? query : []} availableGenres={availableGenres}
                                         onChange={(val) => (val.length <= 5) && this.setState({ query: val })}
                                         onRefreshClicked={() => this.getGenres()}
                                        />}
              />
            </div>
            <div style={{ marginTop: 5 }}>
              <Button style={{ width: '100%' }} color="primary" variant="contained" onClick={() => this.startSearch()}>Start search</Button>
            </div>
          </div>
          <div style={{ flex: '0 1 auto' }}>
            <BPMSlider onLongPress={() => ('ontouchstart' in document.documentElement) && this.handleBpmChange({}, [50, 250])} selectedBpm={selectedBpm} onBpmChange={(e, newValue) => this.handleBpmChange(e, newValue)} height={75} min={0} max={300} />
          </div>
        </div>
        <div className="suggest-bar">
          Getting recommendations for <span style={{ color: '#AEA' }}>{type.toLowerCase()}s</span>
            {query ? 
              (<span> like&nbsp;
                <span style={{ color: '#EAA' }}>
                  {(Array.isArray(query) ?
                    <span>{query.join(', ')}</span> :
                    <span>
                      { query.split(',')
                             .reduce((a, b) => {
                              if (a.length === 0) { a.push(<span>{b}</span>); return a; }
                              a.push(<span style={{ color: 'white' }}>, and </span>, <span>{b}</span>);
                              return a;
                             }, [])
                      }
                    </span>
                   )}
                </span>
              </span>) : ''
            }
            {(Array.isArray(selectedBpm) && selectedBpm.length === 2 ? (<span> and only tracks that are <span style={{ color: '#AAE' }}>{selectedBpm[0]}</span> to <span style={{ color: '#AAE' }}>{selectedBpm[1]} bpm</span> </span>) :
              (typeof selectedBpm === 'number' ? (<span> for tracks with <span style={{ color: '#AAE' }}>{selectedBpm} (± 10) bpm</span> </span>) : '')
            )}
        </div>
        <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
          {(results ? 
            <ResizableFlexbox childrenWidth={210} style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
              <Results data={results} rowPadding={0} onSongClicked={(song, artist) => this.handleSongClick(song, artist)} onArtistClicked={(artist) => this.handleArtistClick(artist)} />
            </ResizableFlexbox>
            :
            <div />
          )}
        </div>
      </div>
    );
  }
}

export default App;
