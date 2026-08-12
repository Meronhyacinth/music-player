import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, ListMusic, Maximize2, Minimize2, Pause, Play, Repeat2, SkipBack, SkipForward, Sparkles, Volume2, VolumeX } from 'lucide-react';
import SoftAurora from './components/SoftAurora';
import SoundWave from './components/SoundWave';
import { hasSpotifyClientId, loadWebPlaybackSdk, restoreSpotifySession, saveSpotifyClientId, spotifyGet, spotifyPut, startSpotifyLogin } from './lib/spotify';

const demoTracks = [
  { title: 'Night Drive', artist: 'Your Spotify library', album: 'Pulsewave Session', art: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=560&q=80', duration: 237 },
  { title: 'Afterglow', artist: 'Your Spotify library', album: 'Moonlit Signals', art: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=560&q=80', duration: 211 },
  { title: 'Static Bloom', artist: 'Your Spotify library', album: 'Violet Frequency', art: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=560&q=80', duration: 254 },
];
const fmt = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function mapSpotifyTrack(item) {
  const track = item?.item ?? item;
  if (!track) return demoTracks[0];
  return { title: track.name, artist: track.artists?.map((artist) => artist.name).join(', ') || 'Spotify', album: track.album?.name || 'Spotify', art: track.album?.images?.[0]?.url || demoTracks[0].art, duration: Math.round((track.duration_ms || 237000) / 1000), uri: track.uri };
}

export default function App() {
  const [track, setTrack] = useState(demoTracks[0]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(86);
  const [likedTracks, setLikedTracks] = useState(new Set());
  const [mini, setMini] = useState(false);
  const [status, setStatus] = useState('Demo mode â€” controls use the built-in queue');
  const [activePage, setActivePage] = useState('Now playing');
  const [demoIndex, setDemoIndex] = useState(0);
  const [repeatMode, setRepeatMode] = useState('off');
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(70);
  const [showClientIdDialog, setShowClientIdDialog] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');
  const tokenRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    const onResize = () => setMini(window.innerWidth < 720 || window.innerHeight < 560);
    onResize(); window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const clock = window.setInterval(() => setProgress((current) => {
      if (current < track.duration) return current + 1;
      if (repeatMode === 'track') return 0;
      if (!playerRef.current) {
        const next = (demoIndex + 1) % demoTracks.length;
        setDemoIndex(next); setTrack(demoTracks[next]); setStatus(`Demo: ${demoTracks[next].title}`);
      }
      return 0;
    }), 1000);
    return () => window.clearInterval(clock);
  }, [isPlaying, track.duration, repeatMode, demoIndex]);

  useEffect(() => {
    const applySession = (code) => restoreSpotifySession(code).then(async (token) => {
      if (!token) return;
      tokenRef.current = token;
      const playback = await spotifyGet('/me/player', token);
      if (playback?.item) { setTrack(mapSpotifyTrack(playback.item)); setProgress(Math.round(playback.progress_ms / 1000)); setIsPlaying(playback.is_playing); }
      setStatus('Spotify connected â€” select Enable playback');
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
          setShowClientIdDialog(true);
          return;
        }
        await startSpotifyLogin();
        setStatus('Spotify authorization opened in your browser');
        return;
      }
      if (playerRef.current) return setStatus('Spotify playback is already enabled');
      const Spotify = await loadWebPlaybackSdk();
      playerRef.current = new Spotify.Player({ name: 'Pulsewave player', getOAuthToken: (callback) => callback(tokenRef.current), volume: volume / 100 });
      playerRef.current.addListener('ready', async ({ device_id: deviceId }) => {
        try { await spotifyPut('/me/player', tokenRef.current, { device_ids: [deviceId], play: false }); setStatus('Pulsewave is your Spotify device'); } catch (error) { setStatus(error.message); }
      });
      playerRef.current.addListener('player_state_changed', (state) => {
        if (!state) return;
        setIsPlaying(!state.paused); setProgress(Math.round(state.position / 1000)); setTrack(mapSpotifyTrack(state.track_window.current_track));
      });
      await playerRef.current.connect();
      setStatus('Spotify player ready');
    } catch (error) { setStatus(error.message); }
  };

  const togglePlayback = async () => { setIsPlaying((value) => !value); if (playerRef.current) await playerRef.current.togglePlay(); };
  const seek = async (event) => { const value = Number(event.target.value); setProgress(value); if (playerRef.current) await playerRef.current.seek(value * 1000); };
  const changeTrack = async (direction) => {
    if (playerRef.current) { await (direction > 0 ? playerRef.current.nextTrack() : playerRef.current.previousTrack()); return; }
    const next = (demoIndex + direction + demoTracks.length) % demoTracks.length;
    setDemoIndex(next); setTrack(demoTracks[next]); setProgress(0); setIsPlaying(true); setStatus(`Demo: ${demoTracks[next].title}`);
  };
  const changeRepeat = () => {
    const next = repeatMode === 'off' ? 'context' : repeatMode === 'context' ? 'track' : 'off';
    setRepeatMode(next); setStatus(`Repeat ${next === 'off' ? 'off' : next}`);
  };
  const toggleLike = () => setLikedTracks((current) => { const next = new Set(current); if (next.has(track.title)) next.delete(track.title); else next.add(track.title); return next; });
  const toggleMute = async () => { const nextMuted = !muted; setMuted(nextMuted); if (playerRef.current) await playerRef.current.setVolume(nextMuted ? 0 : volume / 100); };
  const changeVolume = async (event) => { const nextVolume = Number(event.target.value); setVolume(nextVolume); setMuted(nextVolume === 0); if (playerRef.current) await playerRef.current.setVolume(nextVolume / 100); };
  const choosePage = (page) => { setActivePage(page); setStatus(page === 'Now playing' ? (tokenRef.current ? 'Spotify connected' : 'Demo mode â€” controls use the built-in queue') : `${page} selected`); };
  const submitClientId = async (event) => {
    event.preventDefault();
    if (!clientIdInput.trim()) return;
    saveSpotifyClientId(clientIdInput);
    setClientIdInput('');
    setShowClientIdDialog(false);
    try {
      await startSpotifyLogin();
      setStatus('Spotify authorization opened in your browser');
    } catch (error) { setStatus(error.message); }
  };

  if (mini) return <main className="mini-shell"><SoftAurora active={isPlaying} /><section className="mini-player">
    <img src={track.art} alt="" className="mini-art" /><div className="mini-copy"><span className="mini-kicker">NOW PLAYING</span><strong>{track.title}</strong><span>{track.artist}</span></div><SoundWave active={isPlaying} compact />
    <button className="icon-button mini-toggle" onClick={togglePlayback} aria-label="Toggle playback">{isPlaying ? <Pause /> : <Play />}</button><button className="icon-button" onClick={() => setMini(false)} aria-label="Expand player"><Maximize2 /></button>
  </section></main>;

  const liked = likedTracks.has(track.title);
  return <main className="app-shell"><SoftAurora active={isPlaying} />
    <aside className="sidebar"><div className="brand"><Sparkles size={19} /> PULSEWAVE</div><nav>{['Now playing', 'Your library', 'Liked songs'].map((page) => <button key={page} onClick={() => choosePage(page)} className={activePage === page ? 'nav-active' : ''}>{page}</button>)}</nav><p className="sidebar-note">{status}</p></aside>
    <section className="content"><header><div><span className="eyebrow">LIVE VISUAL SESSION</span><h1>Feel the <em>sound.</em></h1></div><div className="header-actions"><button className="connect" onClick={connectSpotify}>{tokenRef.current ? 'Enable playback' : 'Connect Spotify'}</button><button className="icon-button" onClick={() => setMini(true)} aria-label="Use mini player"><Minimize2 /></button></div></header>
      <div className="hero-grid"><section className="art-stage"><div className={`record ${isPlaying ? 'spinning' : ''}`}><img src={track.art} alt={`${track.album} album cover`} /></div><div className="orbital orbit-a" /><div className="orbital orbit-b" /><SoundWave active={isPlaying} /></section>
      <section className="track-panel"><span className="eyebrow">{tokenRef.current ? 'PLAYING FROM SPOTIFY' : activePage.toUpperCase()}</span><h2>{track.title}</h2><p>{track.artist}</p><div className="track-actions"><button className={`heart ${liked ? 'liked' : ''}`} onClick={toggleLike} aria-label="Like track"><Heart fill={liked ? 'currentColor' : 'none'} /></button><span>{track.album}</span></div>
        <div className="progress-meta"><span>{fmt(progress)}</span><span>{fmt(track.duration)}</span></div><input className="progress" type="range" min="0" max={track.duration} value={progress} onChange={seek} style={{ '--played': `${(progress / track.duration) * 100}%` }} aria-label="Playback progress" />
        <div className="controls"><button className={`icon-button ${repeatMode !== 'off' ? 'selected-control' : ''}`} onClick={changeRepeat} aria-label={`Repeat: ${repeatMode}`}><Repeat2 /><small>{repeatMode === 'track' ? '1' : ''}</small></button><button className="icon-button" onClick={() => changeTrack(-1)} aria-label="Previous track"><SkipBack fill="currentColor" /></button><button className="play-button" onClick={togglePlayback} aria-label="Toggle playback">{isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</button><button className="icon-button" onClick={() => changeTrack(1)} aria-label="Next track"><SkipForward fill="currentColor" /></button><div className="volume-control"><button className="icon-button" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX /> : <Volume2 />}</button><input type="range" min="0" max="100" value={muted ? 0 : volume} onChange={changeVolume} aria-label="Volume" /></div></div>
      </section></div>
      <footer><div><span className="live-dot" /> Ambient playback visual</div><button className="queue-button" onClick={() => choosePage('Your library')}><ListMusic size={17} /> Queue <ChevronLeft size={17} /><ChevronRight size={17} /></button></footer>
    </section>
    {showClientIdDialog && <div className="dialog-backdrop" role="presentation"><form className="client-id-dialog" onSubmit={submitClientId} aria-labelledby="client-id-title"><button type="button" className="dialog-close" onClick={() => setShowClientIdDialog(false)} aria-label="Close">Ã—</button><span className="eyebrow">ONE-TIME SETUP</span><h2 id="client-id-title">Connect Spotify</h2><p>Paste your Spotify <strong>Client ID</strong>. It is saved only on this computer â€” never enter your Client Secret.</p><input autoFocus value={clientIdInput} onChange={(event) => setClientIdInput(event.target.value)} placeholder="Spotify Client ID" aria-label="Spotify Client ID" /><button className="connect" type="submit">Continue to Spotify</button><small>Dashboard â†’ Your app â†’ Settings â†’ Client ID</small></form></div>}
  </main>;
}
