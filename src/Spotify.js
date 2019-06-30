const CamelotKeyToIntegerAndMode = {
  "1A":  [8,  0],   "1B":  [8,  1],
  "2A":  [3,  0],   "2B":  [3,  1],
  "3A":  [10, 0],   "3B":  [10, 1],
  "4A":  [5,  0],   "4B":  [5,  1],
  "5A":  [0,  0],   "5B":  [0,  1],
  "6A":  [7,  0],   "6B":  [7,  1],
  "7A":  [2,  0],   "7B":  [2,  1],
  "8A":  [9,  0],   "8B":  [9,  1],
  "9A":  [4,  0],   "9B":  [4,  1],
  "10A": [11, 0],   "10B": [11, 1],
  "11A": [6,  0],   "11B": [6,  1],
  "12A": [1,  0],   "12B": [1,  1],
}

function secureMathRandom() {
  // Divide a random UInt32 by the maximum value (2^32 -1) to get a result between 0 and 1
  return window.crypto.getRandomValues(new Uint32Array(1))[0] // 4294967295;
}

function handleError(resp, json) {
  if (resp.status === 401) throw resp.status
  if (resp.status !== 200) {
    if (json && json.error && json.error.message) throw json.error.message
    throw resp.status
  }
}

class FetchException extends Error {
  toString() {
    return this.message
  }
}

async function fetchJSONWithOAuthToken(endpoint, token) {
  const resp = await fetch(endpoint, {
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    }
  }).catch(x => { throw new FetchException("Either your internet connection sucks, or Spotify's API is down.."); })
  return resp;
}

export function getTokenInNewWindow(client_id, redirect_url, scopes) {
  const endpoint = "https://accounts.spotify.com/authorize"
  let nonce = secureMathRandom();
  let callable_endpoint = endpoint + "?response_type=token"
  callable_endpoint += "&redirect_uri=" + redirect_url
  callable_endpoint += "&client_id=" + client_id
  if (scopes) callable_endpoint += "&scopes=" + (Array.isArray(scopes) ? scopes.join(' ') : scopes)
  callable_endpoint += "&state=" + nonce

  return new Promise((resolve, reject) => {
    let popup = window.open(callable_endpoint, 'Login with Spotify', 'width=800,height=600')
    window.spotifyCallback = (token, expires, state) => {
      state = parseInt(state)
      popup.close()
      if (state !== nonce) {
        reject(`Nonce is invalid, expected: ${nonce} but got ${state}`)
      } else {
        resolve({ token: token, expires: expires })
      }
    }
  })
}

export async function getGenres(token) {
  const endpoint = "https://api.spotify.com/v1/recommendations/available-genre-seeds"
  const resp = await fetchJSONWithOAuthToken(endpoint, token)
  if (resp.status !== 200) return Promise.reject()
  return await resp.json()
}

export async function searchSpotify(token, searchTerm, type) {
  if (!searchTerm) return Promise.reject("No search terms provided")
  const endpoint = "https://api.spotify.com/v1/search?q=" + searchTerm + "&type=" + type
  console.debug(endpoint)
  const resp = await fetchJSONWithOAuthToken(endpoint, token)
  const json = await resp.json()
  handleError(resp, json)
  return json
}

export async function getRecommendationsBasedOnAttributes(token, { genres, bpm=120, key, songs, artist }) {
  const replaceSongArtists = (term) => term.replace(/\s*\((.*)\)\s*/g, (m, p1) => ` artist:"${p1}" `)
  const extractArtistToEndpoint = (arr) => {
    if(!Array.isArray(arr)) throw new FetchException(400)
    const artistsIds = arr.map(obj => {
      if (!obj.hasOwnProperty("artists") || !obj["artists"]["items"].length) return "";
      return obj["artists"]["items"].map(track => track.id).slice(0, 1).join('')
    }).join(',');
    if (!artistsIds) throw new FetchException("No artists found using your search terms")
    return "&seed_artists=" + artistsIds
  }
  const extractTrackToEndpoint = (arr) => {
    if(!Array.isArray(arr)) throw new FetchException(400)
    const trackIds = arr.map(obj => {
      if (!obj.hasOwnProperty("tracks") || !obj["tracks"]["items"].length) return "";
      return obj["tracks"]["items"].map(track => track.id).slice(0, 1).join('')
    }).join(',')
    if (!trackIds) throw new FetchException("No tracks found using your search terms")
    return "&seed_tracks=" + trackIds
  }

  const endpoint = "https://api.spotify.com/v1/recommendations"
  let callable_endpoint = endpoint + '?'
  if (Array.isArray(bpm) && bpm.length === 2) callable_endpoint += "min_tempo=" + bpm[0] + "&max_tempo=" + bpm[1]
  else callable_endpoint += "min_tempo=" + (bpm - 10) + "&max_tempo=" + (bpm + 10)
  
  try {
    if (songs) {
      const searchResponse = await Promise.all((Array.isArray(songs) ? songs : [songs]).map((term) => searchSpotify(token, replaceSongArtists(term), "track")))
      callable_endpoint += extractTrackToEndpoint(searchResponse)
    } else if (artist) {
      const searchResponse = await Promise.all((Array.isArray(artist) ? artist : [artist]).map((term) => searchSpotify(token, term, "artist")))
      callable_endpoint += extractArtistToEndpoint(searchResponse)
    } else if (genres) {
      callable_endpoint += "&seed_genres=" + (Array.isArray(genres) ? genres.join(',') : genres)
    } else {
      return Promise.reject("No search terms!")
    }
  } catch (status) {
    if (typeof status === 'number' && status === 400) return Promise.reject("Server fucked up");
    else return Promise.reject(status)
  }
  
  let mapped_responses = (await Promise.all((!key ? [] : (Array.isArray(key) ? key : [key]))
  .map(async k => {
    let modifiedEndpoint = callable_endpoint + "&min_key=" + CamelotKeyToIntegerAndMode[k][0] + "&max_key=" + CamelotKeyToIntegerAndMode[k][0]
    modifiedEndpoint += "&min_mode=" + CamelotKeyToIntegerAndMode[k][1] + "&max_mode=" + CamelotKeyToIntegerAndMode[k][1]
    console.debug(modifiedEndpoint)
    const resp = await fetchJSONWithOAuthToken(modifiedEndpoint, token);
    const json = await resp.json();
    handleError(resp, json);
    return { key: k, value: json };
  })))
  .reduce((a, b) => {
    if (a.hasOwnProperty(b.key)) return a;
    a[b.key] = b.value
    return a;
  }, {});

  return mapped_responses
}