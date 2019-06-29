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

class App extends React.Component {
  constructor() {
    super()
    this.state = {
      number: DEFAULT_KEY_NUM,
      isMinor: DEFAULT_KEY_IS_MINOR,
      token: window.localStorage.getItem("token"),
      expires: window.localStorage.getItem("expires"),
      availableGenres: ['country', 'classical', 'rock', 'pop', 'blues', 'r-n-b'],
      results: 'Results go here',
      selectedBpm: DEFAULT_TEMPO,

      type: "Track",
      query: "",
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
      window.history.replaceState(null, null, ' ');
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
    .then(x => this.setState({ results: x }))
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

  setSearchTerms({ query, type }) {
    if (type) {
      this.setState({ type, query: '' })
    } else {
      this.setState({ query })
    }
  }

  render() {
    const { number, isMinor, token, results, availableGenres, selectedBpm, type, query, error } = this.state;
    if (!token) return <div className="App" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Button onClick={() => this.getToken()}>Login to Spotify to use this app</Button></div>
    return (
      <div className="App">
        <ErrorSnackbar open={!!error} error={error} onClose={() => this.setState({ error: null })} />
        <div style={{ backgroundColor: '#eee', padding: 15, boxSizing: 'border-box', display: 'inline-flex', width: '100vw', justifyContent: 'center', flexWrap: 'wrap' }}>
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
        <div style={{ marginTop: 5 }}>
          Getting recommendations for <span style={{ }}>{type.toLowerCase()}s</span>
          <span style={{ color: 'red' }}>
            {query ? (" like " + (Array.isArray(query) ? query.join(', ') : query)) : ''}
            {(Array.isArray(selectedBpm) && selectedBpm.length === 2 ? ` and only tracks that are ${selectedBpm[0]} to ${selectedBpm[1]} bpm` :
             (typeof selectedBpm === 'number' ? ` for tracks with ${selectedBpm} (± 10) bpm ` : '')
            )}
          </span>
        </div>
        <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
          <ResizableFlexbox childrenWidth={219}>
            <Results data={results} />
          </ResizableFlexbox>
        </div>
      </div>
    );
  }
}

export default App;
