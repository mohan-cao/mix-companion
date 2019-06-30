import React from 'react';
import { spanJoiner } from './App';

const mode = {
  "A": [30, 60],
  "B": [70, 90],
}
const key = ["6", "5", "4", "3", "2", "1", "12", "11", "10", "9", "8", "7"]

const keyText = {
  "12A": "12A - Db Minor",
  "1A":  "1A - Ab Minor",
  "2A":  "2A - Eb Minor",
  "3A":  "3A - Bb Minor",
  "4A":  "4A - F Minor",
  "5A":  "5A - C Minor",
  "6A":  "6A - G Minor",
  "7A":  "7A - D Minor",
  "8A":  "8A - A Minor",
  "9A":  "9A - E Minor",
  "10A": "10A - B Minor",
  "11A": "11A - F# Minor",
  "12B": "12B - E Major",
  "1B":  "1B - B Major",
  "2B":  "2B - F Major",
  "3B":  "3B - D Major",
  "4B":  "4B - Ab Major",
  "5B":  "5B - Eb Major",
  "6B":  "6B - Bb Major",
  "7B":  "7B - F Major",
  "8B":  "8B - C Major",
  "9B":  "9B - G Major",
  "10B": "10B - D Major",
  "11B": "11B - A Major",
}

const GetCamelotWheelColor = (displayKey, alpha=1) => {
  const keyHue = Math.max(0, key.indexOf(displayKey.slice(0, -1))) * (360/key.length)
  const keySaturationValuePair = mode[displayKey.slice(-1)]
  return `hsla(${keyHue}, ${keySaturationValuePair[0]}%, ${keySaturationValuePair[1]}%, ${alpha})`
}

const GetCamelotWheelColorText = (displayKey) => {
  const keyHue = Math.max(0, key.indexOf(displayKey.slice(0, -1))) * (360/key.length)
  const keySaturationValuePair = mode[displayKey.slice(-1)]
  return `hsl(${keyHue}, ${keySaturationValuePair[0]}%, ${keySaturationValuePair[1] * 0.3}%)`
}

const ErrorDiv = () => {
  return (
    <div style={{ margin: '0 auto', width: '100%', height: '6em', color: 'white', boxSizing: 'content-box' }}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ fontSize: '2em', margin: 0 }}>No results</h1>
      </div>
    </div>
  );
}

function createDivs(result_obj, onArtistClicked, onSongClicked) {
  if (!result_obj || !result_obj.tracks || result_obj.tracks.length < 1) return <div />;

  const artistClickHandler = (artist) => (e) => {
    if (onArtistClicked) { e.preventDefault(); onArtistClicked(artist); }
  }

  const songClickHandler = (track, artist) => (e) => {
    if (onSongClicked) { e.preventDefault(); onSongClicked(track, artist); }
  }

  return result_obj.tracks
         .sort((a, b) => b.popularity - a.popularity)
         .map((track) => (
            <div key={track.id} className="result-box" style={{ backgroundImage: `url(${track.album ? track.album.images[0].url : ''})` }}>
              <div className="result-vinyl">
                <div className="song-details">
                  <div>
                    <h1 className="artist-name">
                      {track.artists.map((art, i) => (
                        <a className="artist-name" key={art.id + "" + i} href={art.external_urls.spotify}
                           onClick={artistClickHandler(art)}
                           target="_blank" rel="noreferrer noopener">
                          {art.name}
                        </a>
                      )).reduce(spanJoiner, [])}
                    </h1>
                    <h2 className="song-name">
                      <a className="song-name" href={track.external_urls.spotify}
                         onClick={songClickHandler(track, track.artists[0])}
                         target="_blank" rel="noreferrer noopener">
                        {track.name}
                      </a>
                    </h2>
                  </div>
                </div>
              </div>
              <div className="result-vinyl-outer"></div>
              <div className="result-vinyl-inner"></div>
              <div className="result-vinyl-dot"></div>
            </div>
         ));
}

export default function Results({ data, rowPadding, onArtistClicked = null, onSongClicked = null }) {
  if (typeof data !== 'object') return <ErrorDiv />
  const reactObjects = Object.keys(data).reduce((accumulator, musicalKey) => {
    const themeCol = GetCamelotWheelColor(musicalKey);
    const themeTextCol = GetCamelotWheelColorText(musicalKey)
    const elements = createDivs(data[musicalKey], onArtistClicked, onSongClicked)
    if (elements.length) {
      accumulator.push(<div key={musicalKey} className="key-row" style={{ backgroundColor: themeCol, color: themeTextCol, marginBottom: rowPadding }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '2em', margin: 0 }}>{keyText[musicalKey]}</h1>
        </div>
      </div>, ...elements)
    }
    return accumulator
  }, [])
  if (!reactObjects.length) return <ErrorDiv />
  return reactObjects
}
