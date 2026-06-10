import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { apiClient } from '../api/apiClient';
import { toast } from 'react-hot-toast';

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
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [playbackToken, setPlaybackToken] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [isBuffering, setIsBuffering] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);

  // Auto-hide controls timeout
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Secure Stream URL (Tokenized Proxy)
  const fetchStreamUrl = async () => {
    try {
      setIsBuffering(true);
      setError(null);
      const url = serverName ? `/streams/access?serverName=${encodeURIComponent(serverName)}` : '/streams/access';
      const res = await apiClient(url);
      
      if (res && res.playbackToken) {
        // Construct proxy URL
        const proxyUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/streams/play/${res.playbackToken}/index.m3u8`;
        setStreamUrl(proxyUrl);
        setPlaybackToken(res.playbackToken);
        setIsOffline(false);
      } else {
        throw new Error("No playback token returned");
      }
    } catch (err: any) {
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
      fetchStreamUrl();
    }
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
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

  // 2. Initialize HLS.js
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    const initPlayer = () => {
      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new Hls({
          maxLoadingDelay: 4,
          minAutoBitrate: 0,
          lowLatencyMode: true,
          manifestLoadingMaxRetry: 5,
        });

        hlsRef.current = hls;

        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsBuffering(false);
          setError(null);
          video.play().catch(e => {
            console.log("Autoplay blocked:", e);
            setIsPlaying(false);
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error("Network error, attempting to recover...");
                setIsBuffering(true);
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error("Media error, attempting to recover...");
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                setError("Stream disconnected or unavailable.");
                setIsOffline(true);
                // Auto-reconnect after 5 seconds
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
          video.play().catch(() => setIsPlaying(false));
        });
        video.addEventListener('error', () => {
          setError("Native playback error");
          setIsOffline(true);
        });
      }
    };

    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [streamUrl]);

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

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('volumechange', onVolumeChange);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, [videoRef.current]);

  // Handle Controls Visibility
  const handleMouseMove = () => {
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

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        toast.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
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
        className="w-full h-full object-contain cursor-pointer"
        playsInline
        muted={isMuted}
        onClick={togglePlay}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Offline State */}
      {isOffline && !streamUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4 opacity-80" />
          <p className="text-white font-medium text-lg tracking-wide">Stream Offline</p>
          <p className="text-slate-400 text-sm mt-2">Waiting for broadcast to begin...</p>
          <button 
            onClick={() => fetchStreamUrl()} 
            className="mt-6 flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors text-sm font-semibold"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
          </button>
        </div>
      )}

      {/* Buffering Indicator */}
      {isBuffering && !isOffline && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 pointer-events-none">
          <Loader2 className="w-12 h-12 text-white animate-spin opacity-80 drop-shadow-lg" />
        </div>
      )}

      {/* Custom Controls Overlay (Glassmorphism) */}
      <div 
        className={`absolute bottom-0 left-0 right-0 p-4 pt-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 z-30 flex items-end ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
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
                onClick={toggleMute}
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
                className="w-0 opacity-0 group-hover/volume:w-24 group-hover/volume:opacity-100 transition-all duration-300 h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-brand-accent"
              />
            </div>

            {/* Live Badge */}
            <div className="flex items-center px-2 py-1 bg-red-600/90 rounded text-[10px] font-bold text-white tracking-widest uppercase">
              <span className={`w-1.5 h-1.5 rounded-full bg-white mr-1.5 ${isPlaying && !isBuffering ? 'animate-pulse' : ''}`}></span>
              Live
            </div>
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
