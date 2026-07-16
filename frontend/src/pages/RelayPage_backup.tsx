import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Calendar, User, Server, Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactPlayer from 'react-player';

const RelayPage = () => {
  const [isLive] = useState(true);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);

  // Custom Player State
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [muted, setMuted] = useState(true); // Must be true for programmatic cross-origin play in many browsers
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Prevent right click globally on this page (temporarily disabled for debugging)
  useEffect(() => {
    /*
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
    */
  }, []);

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleProgress = (state: any) => {
    setPlayed(state.played);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    if (playerRef.current) {
      playerRef.current.seekTo(parseFloat((e.target as HTMLInputElement).value));
    }
  };

  const handleToggleMute = () => {
    setMuted(!muted);
  };

  const toggleFullScreen = () => {
    if (playerContainerRef.current) {
      if (!document.fullscreenElement) {
        playerContainerRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  // If no server is selected, render the server selection view
  if (!selectedServer) {
    return (
      <div className="min-h-screen bg-brand-bg text-slate-800 flex flex-col font-sans">
        {/* Top Navbar */}
        <header className="bg-white shadow-sm flex justify-between items-center px-6 py-4 z-10 border-b border-slate-200">
          <div className="flex items-center space-x-4">
            <div className="w-32 h-8 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Bismillah_Calligraphy.svg/1024px-Bismillah_Calligraphy.svg.png')] bg-contain bg-center bg-no-repeat opacity-80" style={{ filter: 'invert(1) brightness(0.2)' }}></div>
            <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
            <Link to="/dashboard" className="text-sm font-semibold tracking-wide text-brand-accent hover:text-brand-accent-hover transition-colors hidden sm:block uppercase">Back to Dashboard</Link>
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/profile" className="flex items-center space-x-3 group cursor-pointer">
              <span className="text-sm text-slate-600 font-medium group-hover:text-brand-accent transition-colors">Abbas Ali</span>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-brand-accent/10 transition-colors border border-slate-200">
                <User className="w-4 h-4 text-slate-500 group-hover:text-brand-accent" />
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="clean-panel bg-white p-10 max-w-lg w-full text-center shadow-lg"
          >
            <h2 className="text-2xl font-light text-slate-800 mb-2">Connect to Stream</h2>
            <p className="text-slate-500 text-sm mb-8">Please select a connection server. If you experience buffering during the relay, you can refresh and choose a different server.</p>

            <div className="space-y-4">
              <button
                onClick={() => setSelectedServer('Server A')}
                className="w-full flex items-center justify-between p-5 rounded-xl border border-slate-200 hover:border-brand-accent hover:bg-sky-50 transition-all group"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-brand-accent group-hover:bg-brand-accent group-hover:text-white transition-colors">
                    <Server className="w-6 h-6" />
                  </div>
                  <div className="ml-4 text-left">
                    <div className="font-semibold text-slate-800 group-hover:text-brand-accent transition-colors text-lg">Server A</div>
                    <div className="text-xs text-slate-500">Primary Network</div>
                  </div>
                </div>
                <div className="text-emerald-500 text-xs font-semibold px-3 py-1 bg-emerald-50 rounded-full">Excellent</div>
              </button>

              <button
                onClick={() => setSelectedServer('Server B')}
                className="w-full flex items-center justify-between p-5 rounded-xl border border-slate-200 hover:border-brand-accent hover:bg-sky-50 transition-all group"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-brand-accent group-hover:text-white transition-colors">
                    <Server className="w-6 h-6" />
                  </div>
                  <div className="ml-4 text-left">
                    <div className="font-semibold text-slate-800 group-hover:text-brand-accent transition-colors text-lg">Server B</div>
                    <div className="text-xs text-slate-500">Backup Network</div>
                  </div>
                </div>
                <div className="text-amber-500 text-xs font-semibold px-3 py-1 bg-amber-50 rounded-full">Good</div>
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Render the actual Relay Page once server is selected
  return (
    <div className="min-h-screen bg-brand-bg text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white shadow-sm flex justify-between items-center px-6 py-4 z-10 relative border-b border-slate-200">
        <div className="flex items-center space-x-4">
          <div className="w-32 h-8 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Bismillah_Calligraphy.svg/1024px-Bismillah_Calligraphy.svg.png')] bg-contain bg-center bg-no-repeat opacity-80" style={{ filter: 'invert(1) brightness(0.2)' }}></div>
          <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
          <Link to="/dashboard" className="text-sm font-semibold tracking-wide text-brand-accent hover:text-brand-accent-hover transition-colors hidden sm:block uppercase">Back to Dashboard</Link>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            {isLive ? (
              <span className="text-xs font-bold text-red-500 tracking-wider flex items-center">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-1.5"></span> LIVE
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400 tracking-wider">OFFLINE</span>
            )}
          </div>

          <button className="text-slate-400 hover:text-brand-accent transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-slate-200"></div>

          <Link to="/profile" className="flex items-center space-x-3 group cursor-pointer">
            <span className="text-sm text-slate-600 font-medium group-hover:text-brand-accent transition-colors">Abbas Ali</span>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-brand-accent/10 transition-colors border border-slate-200">
              <User className="w-4 h-4 text-slate-500 group-hover:text-brand-accent" />
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 gap-6">
        {/* Left/Main Column - Video Player */}
        <div className="flex-1 flex flex-col space-y-6">
          <div ref={playerContainerRef} className="w-full relative pt-[56.25%] bg-slate-900 rounded-xl shadow-md overflow-hidden mb-6 group">
            {isLive ? (
              <>
                {(() => {
                  const Player = ReactPlayer as any;
                  return (
                    <Player
                      ref={playerRef}
                      className="absolute top-0 left-0"
                      url="https://www.youtube.com/watch?v=2CO8fcbQ_LQ"
                      width="100%"
                      height="100%"
                      style={{ position: 'absolute', top: 0, left: 0 }}
                      playing={playing}
                      muted={muted}
                      onReady={() => console.log('ReactPlayer is ready')}
                      onStart={() => console.log('ReactPlayer started playing')}
                      onPlay={() => console.log('ReactPlayer onPlay event')}
                      onPause={() => console.log('ReactPlayer onPause event')}
                      onError={(e: any) => console.error('ReactPlayer error:', e)}
                      onProgress={(state: any) => handleProgress(state)}
                      controls={false}
                      config={{
                        youtube: {
                          playerVars: {
                            disablekb: 1,
                            modestbranding: 1,
                            rel: 0,
                            showinfo: 0,
                            iv_load_policy: 3,
                            playsinline: 1
                          }
                        }
                      } as any}
                    />
                  );
                })()}
                
                {/* Custom Overlay & Controls */}
                <div 
                  className="absolute inset-0 z-10 flex flex-col justify-between bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                  onClick={handlePlayPause}
                >
                  <div className="p-4 flex justify-between items-center text-white">
                    <span className="bg-red-600 px-2 py-1 text-xs font-bold rounded">LIVE</span>
                  </div>
                  
                  <div className="p-4 space-y-2" onClick={(e) => e.stopPropagation()}>
                    {/* Progress Slider */}
                    <div className="w-full relative group/slider cursor-pointer">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step="any"
                        value={played}
                        onChange={handleSeekChange}
                        onMouseUp={handleSeekMouseUp}
                        className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-brand-accent hover:h-2 transition-all"
                        style={{
                          background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${played * 100}%, rgba(255, 255, 255, 0.3) ${played * 100}%, rgba(255, 255, 255, 0.3) 100%)`
                        }}
                      />
                    </div>
                    
                    {/* Controls Row */}
                    <div className="flex items-center justify-between text-white pt-2">
                      <div className="flex items-center space-x-4">
                        <button onClick={handlePlayPause} className="hover:text-brand-accent transition-colors">
                          {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                        </button>
                        <button onClick={handleToggleMute} className="hover:text-brand-accent transition-colors">
                          {muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                        </button>
                      </div>
                      <button onClick={toggleFullScreen} className="hover:text-brand-accent transition-colors">
                        <Maximize className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-white/60 text-sm tracking-wide">Stream Offline</p>
                </div>
              </div>
            )}
          </div>

          {/* Stream Info Card */}
          <div className="clean-panel p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-light tracking-tight mb-2 text-slate-800">Lailatul Qadr Bayaan & Waaz</h2>
                <p className="text-brand-accent text-sm font-medium mb-4 uppercase tracking-wider">Syedi Mukasir Saheb (A.Q.)</p>
              </div>
              <div className="bg-sky-50 text-brand-accent border border-sky-100 px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-sm">
                <Server className="w-3 h-3 mr-1.5" /> Connected to {selectedServer}
              </div>
            </div>
            <p className="text-slate-600 leading-relaxed text-sm">
              Join us for the spiritual and uplifting bayaan of Lailatul Qadr. Please ensure your surroundings are quiet and respectful during the relay.
            </p>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <aside className="w-full lg:w-[400px] flex flex-col gap-6">
          {/* Today's Schedule Card */}
          <div className="clean-panel flex flex-col flex-1 max-h-[400px]">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
              </h3>
            </div>
            <div className="p-6 overflow-y-auto space-y-2 custom-scrollbar">
              {[
                { time: '18:30', title: 'Maghrib Isha Namaaz', active: false },
                { time: '19:15', title: 'Salawaat Jaman', active: false },
                { time: '20:00', title: 'Waaz Relay Begins', active: true },
                { time: '22:30', title: 'Dua & Niyaz', active: false }
              ].map((item, idx) => (
                <div key={idx} className={`flex items-baseline py-3 px-4 rounded ${item.active ? 'bg-sky-50 border-l-2 border-brand-accent' : 'bg-slate-50 border-l-2 border-transparent'}`}>
                  <div className={`text-xs font-mono w-16 shrink-0 ${item.active ? 'text-brand-accent font-bold' : 'text-slate-400'}`}>
                    {item.time}
                  </div>
                  <div className={`text-sm ${item.active ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
                    {item.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements Card */}
          <div className="clean-panel flex flex-col flex-1 max-h-[400px]">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center">
                <Bell className="w-4 h-4 mr-2" />
                Announcements
              </h3>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
              {[
                { date: 'Today, 14:00', content: 'Please be seated in the Masjid by 19:45 for the relay.' },
                { date: 'Yesterday', content: 'Salawaat Jaman pass collection will be open tomorrow from 10:00 to 13:00.' }
              ].map((announcement, idx) => (
                <div key={idx} className="group cursor-pointer border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="text-[10px] uppercase tracking-wider text-brand-accent mb-1 font-semibold">{announcement.date}</div>
                  <p className="text-sm text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">{announcement.content}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      <div className="py-4 text-center mt-auto">
        <p className="text-[11px] text-slate-400">2026 Copyright © Sigarul Amalat - Alvazaratus Saifiyah</p>
      </div>
    </div>
  );
};

export default RelayPage;
