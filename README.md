# Pulsewave Spotify player

React/Vite concept player with a compact window mode, React Bits-style animated visual primitives, and Anime.js-driven waveform/aurora motion.

## Run it

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

## Windows desktop app (.exe)

```bash
pnpm build:win
```

This creates `release/Music-Player-Setup-0.1.0.exe`. Install it on any Windows computer; Spotify sign-in and its Client ID remain separate per Spotify developer application.

In Spotify Dashboard add the desktop Redirect URI exactly as `music-player://callback`. On first Spotify connection the installed app asks for the Client ID and stores it locally. You only create the Spotify app once; using the same Client ID in every copy is normal. Never paste the Client Secret into the app.

Add the local URL shown by Vite (normally `http://127.0.0.1:5173/`) as a Redirect URI in your Spotify Dashboard, then set `VITE_SPOTIFY_CLIENT_ID` in `.env.local`.

## Spotify playback constraint

The Spotify Web Playback SDK is the correct path for playback in the browser. It needs a Spotify Premium account and the `streaming` OAuth scope. The Web API can show metadata, library and playback state, but cannot itself stream tracks. The effects in this starter are ambient UI motion: they only start/stop with the player and are not beat-synchronised.

Spotify policy prohibits synchronising Spotify sound recordings with visual media. Do not feed Spotify playback into a beat/FFT analyser or advertise the animation as synced to its tracks. If you want a frequency-accurate waveform, use user-owned/local audio in a separate mode.

## React Bits

React Bits components are meant to be added through their registry or copied locally. `src/components/SoftAurora.jsx` is intentionally a local, project-tuned React Bits-style primitive so it can be themed alongside the player without adding Tailwind/shadcn to this small Vite starter.
