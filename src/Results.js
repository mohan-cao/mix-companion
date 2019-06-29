import React from 'react';
import { spanJoiner } from './App';

export default function Results({ data }) {
  if (!data || !data.tracks || data.tracks.length < 1)
    return <div />;
  return data.tracks.sort((a, b) => b.popularity - a.popularity).map((track) => (<div key={track.id} style={{ backgroundImage: `url(${track.album ? track.album.images[0].url : ''})`, margin: 2, backgroundColor: '#999', border: '2px solid #aaa', boxSizing: 'content-box' }}>
    <div style={{ margin: 5, border: '0.5px solid #aaa', backgroundColor: 'rgba(0, 0, 0, 0.8)', borderRadius: '50%', height: 200, width: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 className="artist-name">{track.artists.map((art, i) => <a className="artist-name" key={art.id + "" + i} href={art.external_urls.spotify}>{art.name}</a>).reduce(spanJoiner, [])}</h1>
      <h2 className="song-name"><a className="song-name" href={track.external_urls.spotify}>{track.name}</a></h2>
    </div>
  </div>));
}
