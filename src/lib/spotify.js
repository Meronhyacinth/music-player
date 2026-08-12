const AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const DESKTOP_REDIRECT_URI = 'music-player://callback';
const scopes = [
  'user-read-private',
  'user-read-email',
  'user-read-playback-state',
  'user-modify-playback-state',
  'streaming',
  'user-read-recently-played',
].join(' ');

const base64url = (bytes) => btoa(String.fromCharCode(...bytes))
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

async function sha256(value) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}

export async function startSpotifyLogin() {
  const clientId = getSpotifyClientId();
  const redirectUri = getRedirectUri();
  if (!clientId || clientId === 'replace_with_your_client_id') {
    throw new Error('Add VITE_SPOTIFY_CLIENT_ID to .env.local first.');
  }
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(64)));
  sessionStorage.setItem('spotify_pkce_verifier', verifier);
  const query = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes,
    code_challenge_method: 'S256',
    code_challenge: base64url(await sha256(verifier)),
  });
  const url = `${AUTHORIZE_URL}?${query}`;
  if (window.musicPlayer?.isDesktop) window.musicPlayer.openExternal(url);
  else window.location.assign(url);
}

export async function restoreSpotifySession(receivedCode) {
  const code = receivedCode || new URLSearchParams(window.location.search).get('code');
  if (!code) return null;
  const verifier = sessionStorage.getItem('spotify_pkce_verifier');
  const clientId = getSpotifyClientId();
  const redirectUri = getRedirectUri();
  if (!verifier || !clientId) return null;

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });
  const response = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!response.ok) throw new Error('Spotify sign-in failed. Check the redirect URI in your Spotify Dashboard.');
  const token = await response.json();
  if (!window.musicPlayer?.isDesktop) window.history.replaceState({}, document.title, redirectUri);
  return token.access_token;
}

function getRedirectUri() {
  return window.musicPlayer?.isDesktop
    ? DESKTOP_REDIRECT_URI
    : (import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin);
}

function getSpotifyClientId() {
  return localStorage.getItem('spotify_client_id') || import.meta.env.VITE_SPOTIFY_CLIENT_ID;
}

export function hasSpotifyClientId() {
  const id = getSpotifyClientId();
  return Boolean(id && id !== 'replace_with_your_client_id');
}

export function saveSpotifyClientId(clientId) {
  localStorage.setItem('spotify_client_id', clientId.trim());
}

export async function spotifyGet(path, accessToken) {
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status === 204) return null;
  if (!response.ok) throw new Error(`Spotify request failed (${response.status}).`);
  return response.json();
}

export async function spotifyPut(path, accessToken, payload) {
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok && response.status !== 204) throw new Error(`Spotify playback request failed (${response.status}).`);
}

export function loadWebPlaybackSdk() {
  return new Promise((resolve, reject) => {
    if (window.Spotify) return resolve(window.Spotify);
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    script.onerror = () => reject(new Error('Could not load the Spotify playback SDK.'));
    window.onSpotifyWebPlaybackSDKReady = () => resolve(window.Spotify);
    document.body.appendChild(script);
  });
}
