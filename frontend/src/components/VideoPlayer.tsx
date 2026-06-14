import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { apiClient } from '../api/apiClient';

interface VideoPlayerProps {
  className?: string;
  fallbackUrl?: string;
  serverName?: string;
  onOffline?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ className = '', fallbackUrl, serverName, onOffline }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const retryTimeoutRef = useRef<number | ReturnType<typeof setTimeout> | null>(null);

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamFormat, setStreamFormat] = useState<'FLV' | 'HLS' | null>(null);
  const [playbackToken, setPlaybackToken] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Start unmuted, let browser block autoplay if needed
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [isBuffering, setIsBuffering] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Auto-hide controls timeout
  const controlsTimeoutRef = useRef<number | ReturnType<typeof setTimeout> | null>(null);
  const volumeTimeoutRef = useRef<number | ReturnType<typeof setTimeout> | null>(null);

  // 1. Fetch Secure Stream URL (Tokenized Proxy)
  const fetchStreamUrl = async () => {
    try {
      setIsBuffering(true);
      setError(null);
      const url = serverName ? `/streams/access?serverName=${encodeURIComponent(serverName)}` : '/streams/access';
      const res = await apiClient(url);
      
      if (res && res.playbackToken) {
        const format = res.streamFormat || 'HLS';
        setStreamFormat(format);
        
        // Proxying infinite chunked HTTP-FLV streams through Express is highly error-prone and can cause 500 NetworkErrors.
        // Construct proxy URL
        const fileName = format === 'FLV' ? 'stream.flv' : 'index.m3u8';
        const proxyUrl = `${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`}/streams/play/${res.playbackToken}/${fileName}`;
        setStreamUrl(proxyUrl);
        
        setPlaybackToken(res.playbackToken);
        setIsOffline(false);
      } else {
        throw new Error("No playback token returned");
      }
    } catch (err: unknown) {
      console.error("Stream fetch error:", err);
      if (fallbackUrl) {
        setStreamUrl(fallbackUrl);
      } else {
        setIsOffline(true);
        setIsBuffering(false);
        if (onOffline) onOffline();
      }
    }
  };

  useEffect(() => {
    if (serverName !== undefined) {
      // eslint-disable-next-line
      fetchStreamUrl();
    }
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverName]);

  // 1.5 Auto-renew token every 3 hours (10800000 ms)
  useEffect(() => {
    if (!playbackToken) return;
    
    const intervalId = setInterval(async () => {
      try {
        await apiClient('/streams/access/renew', {
          method: 'POST',
          body: JSON.stringify({ playbackToken })
        });
        console.log("Stream token auto-renewed successfully");
      } catch (err) {
        console.error("Failed to auto-renew stream token:", err);
      }
    }, 3 * 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [playbackToken]);

  // 2. Initialize Player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    const initPlayer = () => {
      if (streamFormat === 'HLS') {
        try {
          if (hlsRef.current) hlsRef.current.destroy();

          if (Hls.isSupported()) {
            const hls = new Hls({
              maxLoadingDelay: 2,
              minAutoBitrate: 0,
              lowLatencyMode: true,
              backBufferLength: 5,
              liveSyncDurationCount: 2,
              liveMaxLatencyDurationCount: 4,
              manifestLoadingMaxRetry: 5,
            });

            hlsRef.current = hls;
            hls.loadSource(streamUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setIsBuffering(false);
              setError(null);
              const playPromise = video.play();
              if (playPromise !== undefined) {
                playPromise.catch((e) => {
                  console.log("Autoplay blocked:", e);
                  setIsPlaying(false);
                });
              }
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.error("HLS Network Error:", data);
                    setError("Network error connecting to stream. Retrying...");
                    setIsOffline(true);
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.error("HLS Media Error:", data);
                    hls.recoverMediaError();
                    break;
                  default:
                    console.error("Fatal HLS Error:", data);
                    hls.destroy();
                    setError("Fatal stream error. Waiting to retry...");
                    setIsOffline(true);
                    retryTimeoutRef.current = setTimeout(() => {
                      fetchStreamUrl();
                    }, 5000);
                    break;
                }
              }
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            video.src = streamUrl;
            video.addEventListener('loadedmetadata', () => {
              setIsBuffering(false);
              setError(null);
              const playPromise = video.play();
              if (playPromise !== undefined) {
                playPromise.catch((e) => {
                  console.log("Autoplay blocked:", e);
                  setIsPlaying(false);
                });
              }
            });
          } else {
            console.error("HLS is not supported in this browser");
            setError("Stream format not supported by browser.");
            setIsOffline(true);
          }
        } catch (err) {
          console.error("Fatal error initializing HLS player:", err);
          setError("Video player crashed.");
          setIsOffline(true);
        }
      }
    };

    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl, streamFormat]);

  // Video Event Listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onVolumeChange = () => {
      setIsMuted(video.muted);
      setVolume(video.volume);
    };
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, []);

  // Handle Controls Visibility
  const handleMouseMove = () => {
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouchDevice) return; // Prevent touch screens from firing mouse events

    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2500);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  };

  const handleSpeakerClick = () => {
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    if (isTouchDevice) {
      if (!showVolumeSlider) {
        setShowVolumeSlider(true);
      } else {
        toggleMute();
      }
      
      // Auto-hide the volume slider after 4 seconds of inactivity
      if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
      volumeTimeoutRef.current = setTimeout(() => setShowVolumeSlider(false), 4000);
    } else {
      toggleMute();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val > 0 && videoRef.current.muted) {
        videoRef.current.muted = false;
      } else if (val === 0) {
        videoRef.current.muted = true;
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const jumpToLive = () => {
    if (videoRef.current) {
      // Seek to very near the end for live HLS streams
      videoRef.current.currentTime = videoRef.current.duration - 2;
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        // Lock to landscape on mobile devices
        if (window.innerWidth < 768 && window.screen && window.screen.orientation && (window.screen.orientation as any).lock) {
          try {
            await (window.screen.orientation as any).lock('landscape');
          } catch {
            console.log("Orientation lock not supported/denied");
          }
        }
      } else {
        await document.exitFullscreen();
        // Unlock orientation on mobile
        if (window.innerWidth < 768 && window.screen && window.screen.orientation && (window.screen.orientation as any).unlock) {
          (window.screen.orientation as any).unlock();
        }
      }
    } catch (err: unknown) {
      console.error("Fullscreen toggle error:", err);
    }
  };

  const handleVideoClick = () => {
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    if (isTouchDevice) {
      setShowControls((prev) => {
        const nextState = !prev;
        if (nextState) {
          if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
          controlsTimeoutRef.current = setTimeout(() => {
            if (videoRef.current && !videoRef.current.paused) setShowControls(false);
          }, 3500);
        }
        return nextState;
      });
    } else {
      togglePlay();
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black group overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onDoubleClick={toggleFullscreen}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer lg:scale-[1.005]"
        playsInline
        autoPlay
        muted={isMuted}
        onClick={handleVideoClick}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Offline State */}
      {isOffline && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4 opacity-80" />
          <p className="text-white font-medium text-lg tracking-wide">Stream Offline</p>
          <p className="text-slate-400 text-sm mt-2 text-center max-w-md break-words">
            {error || 'Waiting for broadcast to begin...'}
          </p>
          <button 
            onClick={() => fetchStreamUrl()} 
            className="mt-6 flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors text-sm font-semibold"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
          </button>
        </div>
      )}

      {/* Loading State */}
      {isBuffering && !isOffline && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      {/* Custom Controls Overlay (Glassmorphism) */}
      <div 
        className={`absolute bottom-0 left-0 right-0 p-4 pt-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 z-30 flex flex-col justify-end ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Bar */}
        <div className="w-full flex items-center space-x-3 mb-4 group/progress cursor-pointer relative z-40">
          <input 
            type="range" 
            min="0" 
            max={duration || 100} 
            step="0.1" 
            value={currentTime} 
            onChange={handleSeek}
            style={{
              background: `linear-gradient(to right, var(--color-brand-accent) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255, 255, 255, 0.3) ${duration > 0 ? (currentTime / duration) * 100 : 0}%)`
            }}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-brand-accent hover:h-2 transition-all duration-200"
          />
        </div>

        <div className="flex items-center justify-between w-full">
          {/* Left Controls */}
          <div className="flex items-center space-x-6">
            <button 
              onClick={togglePlay}
              className="text-white hover:text-brand-accent transition-transform hover:scale-110"
            >
              {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
            </button>

            <div className="flex items-center space-x-3 group/volume">
              <button 
                onClick={handleSpeakerClick}
                className="text-white hover:text-brand-accent transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={isMuted ? 0 : volume} 
                onChange={handleVolumeChange}
                className={`transition-all duration-300 h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-brand-accent ${showVolumeSlider ? 'w-24 opacity-100' : 'w-0 opacity-0 group-hover/volume:w-24 group-hover/volume:opacity-100'}`}
              />
            </div>

            {/* Live Badge */}
            <button 
              onClick={jumpToLive}
              className={`flex items-center px-2 py-1 bg-red-600/90 rounded text-[10px] font-bold text-white tracking-widest uppercase hover:bg-red-500 transition-colors cursor-pointer ${duration - currentTime > 10 ? 'opacity-70' : 'opacity-100'}`}
              title={duration - currentTime > 10 ? "Click to jump to live edge" : "You are watching live"}
            >
              <span className={`w-1.5 h-1.5 rounded-full bg-white mr-1.5 ${isPlaying && !isBuffering && (duration - currentTime <= 10) ? 'animate-pulse' : ''}`}></span>
              Live
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center">
            <button 
              onClick={toggleFullscreen}
              className="text-white hover:text-brand-accent transition-transform hover:scale-110"
            >
              {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
