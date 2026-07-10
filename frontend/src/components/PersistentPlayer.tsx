import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlayer } from '../contexts/PlayerContext';
import ReactPlayer from 'react-player';
import VideoPlayer from './VideoPlayer';

const PersistentPlayer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCurrentlyLive, activeStream, selectedServer, isPlayerVisible, setIsPlayerVisible, playerRect, isLoadingStream } = usePlayer();
  const isRelayPage = location.pathname === '/relay';
  const playerRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate drag bounds to keep the mini-player on screen
  const [dragBounds, setDragBounds] = useState({ left: 0, right: 0, top: 0, bottom: 0 });

  useEffect(() => {
    const updateBounds = () => {
      setDragBounds({
        left: -(window.innerWidth - 320 - 48), // 320 width + 24px padding on each side
        top: -(window.innerHeight - 180 - 48), // 180 height + 24px padding on each side
        right: 0,
        bottom: 0,
      });
    };
    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, []);

  // Fullscreen exit listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFs);
      if (!isFs) {
        // Exited fullscreen! Go to relay page
        navigate('/relay');
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [navigate]);

  const handleShowControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleOverlayClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setShowControls((prev) => {
      if (prev) {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        return false;
      } else {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
        return true;
      }
    });
  };

  const handlePointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    handleShowControls();
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(false);
  };

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    const elem = videoContainerRef.current;
    if (elem) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().then(() => {
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
          }
        }).catch(() => {});
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      }
    }
  };

  // Auto-show player if user navigates to relay page
  useEffect(() => {
    if (isRelayPage && !isPlayerVisible) {
      setIsPlayerVisible(true);
    }
  }, [isRelayPage, isPlayerVisible, setIsPlayerVisible]);

  const isActive = isCurrentlyLive && selectedServer;
  
  // We want to hide it completely (and unmount to stop playback) if it shouldn't be visible
  const isVisible = isActive && (isPlayerVisible || isRelayPage);
  
  if (!isVisible) {
    return null;
  }
  
  // Also hide it on the Relay Page if we haven't calculated the rect yet to prevent a jump flash
  const isReady = !isRelayPage || playerRect.width > 0;

  // The actual video content to render
  const renderVideo = () => {
    if (!isActive) return null;
    
    if (activeStream.streamType === 'YOUTUBE') {
      return (
        <ReactPlayer
          url={
            selectedServer.url.includes('<iframe')
              ? (selectedServer.url.match(/src="([^"]+)"/) || [])[1] || selectedServer.url
              : selectedServer.url
          }
          width="100%"
          height="100%"
          controls={isRelayPage || isFullscreen}
          playing={true}
          muted={!isRelayPage}
          className="absolute inset-0"
          config={{
            youtube: {
              playerVars: { autoplay: 1 }
            }
          }}
        />
      );
    }
    return (
      <VideoPlayer
        className="w-full h-full absolute inset-0"
        fallbackUrl={selectedServer.url}
        serverName={selectedServer.name}
        hideControls={!isRelayPage && !isFullscreen}
        defaultMuted={!isRelayPage}
      />
    );
  };

  return (
    <motion.div
      ref={playerRef}
      drag={!isRelayPage}
      dragConstraints={dragBounds}
      dragElastic={0.1}
      // Snap it back to origin (relative to CSS positioning) when returning to relay page
      animate={{ x: isRelayPage ? 0 : undefined, y: isRelayPage ? 0 : undefined }}
      style={{
        display: isVisible ? 'block' : 'none',
        opacity: isReady ? 1 : 0,
        position: isRelayPage ? 'absolute' : 'fixed',
        top: isRelayPage ? playerRect.top : undefined,
        left: isRelayPage ? playerRect.left : undefined,
        width: isRelayPage ? playerRect.width : 320,
        height: isRelayPage ? playerRect.height : 180,
        bottom: isRelayPage ? undefined : 24,
        right: isRelayPage ? undefined : 24,
        zIndex: isRelayPage ? 30 : 9999,
        transition: 'width 0.3s, height 0.3s, top 0.3s, left 0.3s, opacity 0.2s',
      }}
      className={`bg-black overflow-hidden shadow-2xl ${isRelayPage ? 'rounded-2xl ring-1 ring-white/5' : 'rounded-xl border border-slate-700/50 cursor-move group'}`}
    >
      <div ref={videoContainerRef} className={`w-full h-full relative pointer-events-auto bg-black`}>
        {renderVideo()}
      </div>

      {/* Mini Player Overlay (hides native controls and handles tap logic) */}
      {!isRelayPage && !isFullscreen && (
        <div 
          className="absolute inset-0 z-40 cursor-pointer pointer-events-auto"
          onClick={handleOverlayClick}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        >
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity"
              >
                <div 
                  className="transform hover:scale-110 transition-transform cursor-pointer text-white"
                  onClick={handleMaximize}
                  title="Expand to Fullscreen"
                >
                  <Maximize className="w-10 h-10 drop-shadow-md" strokeWidth={2.5} />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlayerVisible(false);
                  }}
                  className="absolute top-2 right-2 p-1.5 text-white/80 hover:text-red-400 hover:bg-black/40 rounded transition-colors"
                  title="Close mini-player"
                >
                  <X className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default PersistentPlayer;
