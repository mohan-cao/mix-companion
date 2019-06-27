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
  const resp = await fetch(endpoint, {
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    }
  })
  if (resp.status !== 200) return Promise.reject()
  return resp.json()
}

export async function getRecommendationsBasedOnAttributes(token, { genres, bpm, key }) {
  const endpoint = "https://api.spotify.com/v1/recommendations"
  let callable_endpoint = endpoint + "?seed_genres=" + (Array.isArray(genres) ? genres.join(',') : genres)
  callable_endpoint += "&min_key=" + CamelotKeyToIntegerAndMode[key][0] + "&max_key=" + CamelotKeyToIntegerAndMode[key][0]
  callable_endpoint += "&min_mode=" + CamelotKeyToIntegerAndMode[key][1] + "&max_mode=" + CamelotKeyToIntegerAndMode[key][1]
  callable_endpoint += "&target_tempo=" + bpm
  console.log(callable_endpoint)
  const resp = await fetch(callable_endpoint, {
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    }
  })
  if (resp.status !== 200) return Promise.reject()
  return resp.json()
}