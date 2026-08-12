import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, ListMusic, Maximize2, Minimize2, Pause, Play, Repeat2, SkipBack, SkipForward, Sparkles, Volume2 } from 'lucide-react';
import SoftAurora from './components/SoftAurora';
import SoundWave from './components/SoundWave';
import { hasSpotifyClientId, loadWebPlaybackSdk, restoreSpotifySession, saveSpotifyClientId, spotifyGet, spotifyPut, startSpotifyLogin } from './lib/spotify';

const demoTrack = {
  title: 'Night Drive',
  artist: 'Your Spotify library',
  album: 'Pulsewave Session',
  art: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=560&q=80',
  duration: 237,
};

const fmt = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function mapSpotifyTrack(item) {
  const track = item?.item ?? item;
  if (!track) return demoTrack;
  return {
    title: track.name,
    artist: track.artists?.map((artist) => artist.name).join(', ') || 'Spotify',
    album: track.album?.name || 'Spotify',
    art: track.album?.images?.[0]?.url || demoTrack.art,
    duration: Math.round((track.duration_ms || 237000) / 1000),
    uri: track.uri,
  };
}

export default function App() {
  const [track, setTrack] = useState(demoTrack);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(86);
  const [liked, setLiked] = useState(false);
  const [mini, setMini] = useState(false);
  const [status, setStatus] = useState('Demo mode');
  const tokenRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    const onResize = () => setMini(window.innerWidth < 720 || window.innerHeight < 560);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const clock = window.setInterval(() => setProgress((current) => current >= track.duration ? 0 : current + 1), 1000);
    return () => window.clearInterval(clock);
  }, [isPlaying, track.duration]);

  useEffect(() => {
    const applySession = (code) => restoreSpotifySession(code).then(async (token) => {
      if (!token) return;
      tokenRef.current = token;
      const playback = await spotifyGet('/me/player', token);
      if (playback?.item) {
        setTrack(mapSpotifyTrack(playback.item));
        setProgress(Math.round(playback.progress_ms / 1000));
        setIsPlaying(playback.is_playing);
      }
      setStatus('Spotify connected');
    }).catch((error) => setStatus(error.message));
    applySession();
    return window.musicPlayer?.onSpotifyCallback((url) => {
      const code = new URL(url).searchParams.get('code');
      if (code) applySession(code);
    });
  }, []);

  const connectSpotify = async () => {
    try {
      if (!tokenRef.current) {
        if (!hasSpotifyClientId()) {
          const clientId = window.prompt('Paste the Spotify Client ID from your Spotify Developer Dashboard. It is saved only on this computer.');
          if (!clientId) return;
          saveSpotifyClientId(clientId);
        }
        return startSpotifyLogin();
      }
      const Spotify = await loadWebPlaybackSdk();
      playerRef.current = new Spotify.Player({
        name: 'Pulsewave web player',
        getOAuthToken: (callback) => callback(tokenRef.current),
        volume: 0.7,
      });
      playerRef.current.addListener('ready', async ({ device_id: deviceId }) => {
        try {
          await spotifyPut('/me/player', tokenRef.current, { device_ids: [deviceId], play: false });
          setStatus('Pulsewave is your Spotify device');
        } catch (error) { setStatus(error.message); }
      });
      playerRef.current.addListener('player_state_changed', (state) => {
        if (!state) return;
        setIsPlaying(!state.paused);
        setProgress(Math.round(state.position / 1000));
        setTrack(mapSpotifyTrack(state.track_window.current_track));
      });
      await playerRef.current.connect();
      setStatus('Spotify player ready');
    } catch (error) { setStatus(error.message); }
  };

  const togglePlayback = async () => {
    setIsPlaying((value) => !value);
    if (playerRef.current) await playerRef.current.togglePlay();
  };
  const seek = async (event) => {
    const value = Number(event.target.value);
    setProgress(value);
    if (playerRef.current) await playerRef.current.seek(value * 1000);
  };

  if (mini) {
    return <main className="mini-shell"><SoftAurora active={isPlaying} /><section className="mini-player">
      <img src={track.art} alt="" className="mini-art" />
      <div className="mini-copy"><span className="mini-kicker">NOW PLAYING</span><strong>{track.title}</strong><span>{track.artist}</span></div>
      <SoundWave active={isPlaying} compact />
      <button className="icon-button mini-toggle" onClick={togglePlayback} aria-label="Toggle playback">{isPlaying ? <Pause /> : <Play />}</button>
      <button className="icon-button" onClick={() => setMini(false)} aria-label="Expand player"><Maximize2 /></button>
    </section></main>;
  }

  return <main className="app-shell"><SoftAurora active={isPlaying} />
    <aside className="sidebar"><div className="brand"><Sparkles size={19} /> PULSEWAVE</div><nav><button className="nav-active">Now playing</button><button>Your library</button><button>Liked songs</button></nav><p className="sidebar-note">{status}</p></aside>
    <section className="content">
      <header><div><span className="eyebrow">LIVE VISUAL SESSION</span><h1>Feel the <em>sound.</em></h1></div><div className="header-actions"><button className="connect" onClick={connectSpotify}>{tokenRef.current ? 'Enable playback' : 'Connect Spotify'}</button><button className="icon-button" onClick={() => setMini(true)} aria-label="Use mini player"><Minimize2 /></button></div></header>
      <div className="hero-grid"><section className="art-stage"><div className={`record ${isPlaying ? 'spinning' : ''}`}><img src={track.art} alt={`${track.album} album cover`} /></div><div className="orbital orbit-a" /><div className="orbital orbit-b" /><SoundWave active={isPlaying} /></section>
      <section className="track-panel"><span className="eyebrow">PLAYING FROM SPOTIFY</span><h2>{track.title}</h2><p>{track.artist}</p><div className="track-actions"><button className={`heart ${liked ? 'liked' : ''}`} onClick={() => setLiked(!liked)} aria-label="Like track"><Heart fill={liked ? 'currentColor' : 'none'} /></button><span>{track.album}</span></div>
        <div className="progress-meta"><span>{fmt(progress)}</span><span>{fmt(track.duration)}</span></div><input className="progress" type="range" min="0" max={track.duration} value={progress} onChange={seek} aria-label="Playback progress" />
        <div className="controls"><button className="icon-button"><Repeat2 /></button><button className="icon-button"><SkipBack fill="currentColor" /></button><button className="play-button" onClick={togglePlayback} aria-label="Toggle playback">{isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</button><button className="icon-button"><SkipForward fill="currentColor" /></button><button className="icon-button"><Volume2 /></button></div>
      </section></div>
      <footer><div><span className="live-dot" /> Ambient playback visual</div><div><ListMusic size={17} /> Queue <ChevronLeft size={17} /><ChevronRight size={17} /></div></footer>
    </section>
  </main>;
}
