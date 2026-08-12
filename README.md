# Pulsewave Spotify player

React/Vite concept player with a compact window mode, React Bits-style animated visual primitives, Anime.js-driven waveform/aurora motion, and a Windows Electron app.

## Run the web version

```bash
pnpm install
pnpm dev
```

To use Spotify in local web development, copy `.env.example` to `.env.local`, set your Client ID, and allowlist `http://127.0.0.1:5173/` in Spotify Dashboard.

## Build for your website

Set these environment variables in your web host, then build:

```env
VITE_SPOTIFY_CLIENT_ID=your_client_id
VITE_SPOTIFY_REDIRECT_URI=https://music.yourdomain.com/
```

```bash
pnpm build
```

Deploy the generated `dist/` directory. In Spotify Dashboard add the exact HTTPS domain as both Website and a Redirect URI.

## Windows desktop app (.exe)

```bash
pnpm build:win
```

This creates `dist/Music-Player-Setup-0.1.0.exe`. The build uses relative asset paths so it loads correctly inside Electron rather than displaying a blank screen.

In Spotify Dashboard add the desktop Redirect URI exactly as `music-player://callback`. On first Spotify connection the installed app asks for the Client ID and stores it locally. You only create the Spotify app once; using the same Client ID in every copy is normal. Never paste the Client Secret into the app.

## Spotify playback constraint

The Spotify Web Playback SDK is the correct path for browser/desktop playback. It needs a Spotify Premium account and the `streaming` OAuth scope. The Web API can show metadata, library and playback state, but cannot itself stream tracks. The effects in this starter are ambient UI motion: they only start/stop with the player and are not beat-synchronised.

Spotify policy prohibits synchronising Spotify sound recordings with visual media. Do not feed Spotify playback into a beat/FFT analyser or advertise the animation as synced to its tracks. If you want a frequency-accurate waveform, use user-owned/local audio in a separate mode.

## React Bits

`src/components/SoftAurora.jsx` is a local, project-tuned React Bits-style primitive that can be themed alongside the player without requiring Tailwind/shadcn.
