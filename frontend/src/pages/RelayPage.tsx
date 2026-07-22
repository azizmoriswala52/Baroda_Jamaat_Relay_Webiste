import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, PlayCircle, Settings, Users, Server, ExternalLink, RefreshCw, Radio, FileText, ChevronRight, Share2, MessageSquare, Plus, Trash2, Calendar, Menu, Home, Video, LogOut, User, Bell, Maximize, Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiClient } from '../api/apiClient';
import { useConfirm } from '../contexts/ConfirmContext';
import { usePlayer } from '../contexts/PlayerContext';

const RelayPage = () => {
  const queryClient = useQueryClient();

  // Get current user from local storage
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userName = user?.fullName || 'User';
  const isAdmin = user?.role === 'ADMIN';
  const displayName = isAdmin ? `${userName} (Admin)` : userName;

  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const confirm = useConfirm();

  const handleLogoutWithConfirm = async () => {
    if (await confirm("Do you want to logout?")) {
      try {
        await apiClient('/auth/logout', { method: 'POST' });
      } catch (e) {
        // Ignore error
      }
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      localStorage.setItem('logout', Date.now().toString());
      navigate('/login');
    }
  };

  const { 
    activeStream, 
    isLoadingStream, 
    isStreamError, 
    refetchStream, 
    isFetchingStream,
    isCurrentlyLive,
    servers,
    selectedServer,
    setSelectedServer,
    setPlayerRect,
    hasAgreedToRules,
    setHasAgreedToRules,
    streamErrorMsg
  } = usePlayer();

  const [showAgreementModal, setShowAgreementModal] = useState(false);

  useEffect(() => {
    if (isCurrentlyLive && !hasAgreedToRules) {
      setShowAgreementModal(true);
    } else {
      setShowAgreementModal(false);
    }
  }, [isCurrentlyLive, hasAgreedToRules]);

  const handleAgree = () => {
    setHasAgreedToRules(true);
    setShowAgreementModal(false);
  };

  const handleDisagree = () => {
    navigate('/dashboard');
  };

  const placeholderRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const updateRect = () => {
      if (placeholderRef.current) {
        const mainContainer = document.getElementById('main-scroll-container');
        if (!mainContainer) return;
        
        const mainRect = mainContainer.getBoundingClientRect();
        const phRect = placeholderRef.current.getBoundingClientRect();
        
        setPlayerRect({
          top: phRect.top - mainRect.top + mainContainer.scrollTop,
          left: phRect.left - mainRect.left,
          width: phRect.width,
          height: phRect.height
        });
      }
    };

    updateRect();
    
    // We use a small timeout to ensure layout is fully settled
    setTimeout(updateRect, 100);

    const observer = new ResizeObserver(updateRect);
    if (placeholderRef.current) {
      observer.observe(placeholderRef.current);
    }
    window.addEventListener('resize', updateRect);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateRect);
      // Reset when unmounting relay page
      setPlayerRect({ top: 0, left: 0, width: 0, height: 0 });
    };
  }, [setPlayerRect]);

  const handleServerSelect = (server: any) => {
    setSelectedServer(server);
  };

  useEffect(() => {
    if (!isLoadingStream) {
      if (isStreamError || !activeStream || !activeStream.isLive) {
        toast.error('The live stream is currently offline.', { icon: '📡' });
        navigate('/dashboard', { replace: true });
      }
    }
  }, [activeStream, isLoadingStream, isStreamError, navigate]);

  // Fetch announcements/schedule
  const { data: announcements, isLoading: isLoadingAnnouncements } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => apiClient('/announcements'),
    refetchInterval: 5000,
  });

  // Mutations for Announcements
  const createAnnMutation = useMutation({
    mutationFn: (data: { content: string, type: string, time: string }) => apiClient('/announcements', {
      method: 'POST', body: JSON.stringify(data),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] })
  });

  const deleteAnnMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/announcements/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] })
  });

  // State for inline forms
  const [scheduleContent, setScheduleContent] = useState('');
  const [updateContent, setUpdateContent] = useState('');
  const [serverError, setServerError] = useState(false);

  useDocumentTitle(activeStream?.title || 'Relay');
  const [updateError, setUpdateError] = useState(false);
  const [scheduleError, setScheduleError] = useState(false);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleContent.trim()) {
      setScheduleError(true);
      return;
    }
    createAnnMutation.mutate({ type: 'SCHEDULE', time: getCurrentTime(), content: scheduleContent }, {
      onSuccess: () => setScheduleContent('')
    });
  };

  const handleAddUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateContent.trim()) {
      setUpdateError(true);
      return;
    }
    createAnnMutation.mutate({ type: 'UPDATE', time: getCurrentTime(), content: updateContent }, {
      onSuccess: () => setUpdateContent('')
    });
  };



  const schedules = announcements?.filter((a: any) => a.type === 'SCHEDULE') || [];
  const updates = announcements?.filter((a: any) => a.type === 'UPDATE') || [];

  return (
    <>
      <div className="mb-8 w-full">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-brand-accent dark:text-blue-300 tracking-wide">Relay Room</h3>
          {isCurrentlyLive && (
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => refetchStream()}
              className="p-2 transition-colors bg-transparent border-none cursor-pointer group"
              title="Refresh Stream"
            >
              <RefreshCw className={`w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-brand-accent dark:text-blue-300 transition-colors ${isFetchingStream ? 'animate-spin text-brand-accent dark:text-blue-300' : ''}`} />
            </button>
            <span className="bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-widest flex items-center shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white dark:bg-slate-800 animate-pulse mr-2"></span> LIVE NOW
            </span>
          </div>
        )}
        </div>
        <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-700 mt-2"></div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row gap-6 w-full flex-1 min-w-0">
        {/* Left/Main Column - Video Player */}
        <div className="flex-1 flex flex-col space-y-6">
          
          {/* Server Selection Area - Inline Buttons */}
          {isCurrentlyLive && servers.length > 1 && (
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-2">Select Server:</span>
              {servers.map((server: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleServerSelect(server)}
                  className={`btn-primary flex items-center space-x-2 ${
                    selectedServer?.name === server.name 
                      ? '!bg-brand-accent !text-white' 
                      : ''
                  }`}
                >
                  <span>{server.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Error Message or Placeholder for the Persistent Player */}
          {streamErrorMsg ? (
            <div className="w-full aspect-video rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Access Denied</h3>
              <p className="text-slate-600 dark:text-slate-300 font-medium">{streamErrorMsg}</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-4">Please contact the administrator if you believe this is a mistake.</p>
            </div>
          ) : (
            <div ref={placeholderRef} className="w-full aspect-video rounded-2xl bg-transparent relative">
              {!isCurrentlyLive && !isFetchingStream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600">
                  <Video className="w-12 h-12 text-slate-300 mb-4" />
                  <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400 mb-1">Relay Offline</h3>
                  <p className="text-sm text-slate-400">Waiting for stream to begin...</p>
                </div>
              )}
            </div>
          )}

          {/* Stream Info Card */}
          <div className="clean-panel overflow-hidden">
            <div className="bg-slate-200 dark:bg-slate-700 dark:bg-slate-800 px-6 py-4 border-b border-slate-300 dark:border-slate-600 dark:border-slate-700 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold tracking-tight mb-1 text-slate-800 dark:text-slate-100">{activeStream?.title || 'Relay Offline'}</h2>
                <p className="text-brand-accent dark:text-blue-300 text-xs font-bold uppercase tracking-widest">{activeStream?.speaker || 'Waiting for connection...'}</p>
              </div>
              {selectedServer && servers.length > 1 && (
                <div className="bg-white dark:bg-slate-800 dark:bg-slate-700 text-brand-accent dark:text-blue-300 border border-slate-200 dark:border-slate-700 dark:border-slate-600 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center shadow-sm">
                  Connected to {selectedServer.name}
                </div>
              )}
            </div>
            
            {activeStream?.description && (
              <div className="p-6 bg-white dark:bg-slate-800 dark:bg-slate-900/50">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                  {activeStream.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <aside className="w-full lg:w-[450px] flex flex-col gap-6 shrink-0">
          {/* Today's Schedule Card */}
          <div className="clean-panel flex flex-col flex-1 max-h-[450px]">
            <div className="bg-slate-200 dark:bg-slate-700 dark:bg-slate-800 px-6 py-4 border-b border-slate-300 dark:border-slate-600 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-200 dark:text-slate-300 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
                Schedule
              </h3>
            </div>
            
            {/* Admin Add Schedule Inline Form */}
            {isAdmin && (
              <form onSubmit={handleAddSchedule} className="p-4 border-b border-slate-100 bg-sky-50 dark:bg-slate-800/30 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Schedule Event Title..." 
                    value={scheduleContent}
                    onChange={(e) => {
                      setScheduleContent(e.target.value);
                      if (scheduleError) setScheduleError(false);
                    }}
                    className={`flex-1 text-xs px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all ${scheduleError ? 'border-red-500 bg-red-50 animate-gentle-shake' : 'border-slate-200 dark:border-slate-700'}`}
                  />
                  <button type="submit" disabled={createAnnMutation.isPending} className="btn-primary !px-3 !py-2 !min-w-0">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {scheduleError && <p className="text-red-500 text-xs px-1">Schedule Event Title is required</p>}
              </form>
            )}

            <div className="p-6 overflow-y-auto space-y-2 custom-scrollbar">
              {isLoadingAnnouncements ? (
                <p className="text-sm text-slate-400">Loading schedule...</p>
              ) : schedules.length > 0 ? (
                schedules.map((item: any) => (
                  <div key={item._id} className="flex items-center justify-between py-3 px-4 rounded bg-slate-50 dark:bg-slate-900/50 border-l-2 border-slate-300 dark:border-slate-600 hover:border-brand-accent dark:hover:border-blue-400 transition-colors group">
                    <div className="flex items-baseline overflow-hidden">
                      <div className="text-xs font-mono w-auto shrink-0 pr-4 text-brand-accent dark:text-blue-300 font-semibold">
                        {item.time}
                      </div>
                      <div className="text-sm text-slate-700 dark:text-slate-200 dark:text-slate-300 truncate">
                        {item.content}
                      </div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => deleteAnnMutation.mutate(item._id)} className="text-slate-300 hover:text-red-500 transition-colors ml-2 flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No scheduled events yet.</p>
              )}
            </div>
          </div>

          {/* Announcements Card */}
          <div className="clean-panel flex flex-col flex-1 max-h-[450px]">
            <div className="bg-slate-200 dark:bg-slate-700 px-6 py-4 border-b border-slate-300 dark:border-slate-600 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-200 flex items-center">
                <Bell className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
                Live Updates
              </h3>
            </div>

            {/* Admin Add Update Inline Form */}
            {isAdmin && (
              <form onSubmit={handleAddUpdate} className="p-4 border-b border-slate-100 bg-blue-50/30 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Post a live update..." 
                    value={updateContent}
                    onChange={(e) => {
                      setUpdateContent(e.target.value);
                      if (updateError) setUpdateError(false);
                    }}
                    className={`flex-1 text-xs px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all ${updateError ? 'border-red-500 bg-red-50 animate-gentle-shake' : 'border-slate-200 dark:border-slate-700'}`}
                  />
                  <button type="submit" disabled={createAnnMutation.isPending} className="btn-primary !px-3 !py-2 !min-w-0">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {updateError && <p className="text-red-500 text-xs px-1">Live Update is required</p>}
              </form>
            )}

            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
              {isLoadingAnnouncements ? (
                <p className="text-sm text-slate-400">Loading announcements...</p>
              ) : updates.length > 0 ? (
                updates.map((ann: any) => (
                  <div key={ann._id} className="group border-b border-slate-100 pb-4 last:border-0 last:pb-0 flex justify-between items-start">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-brand-accent dark:text-blue-300 mb-1 font-semibold">{ann.time}</div>
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed group-hover:text-slate-900 dark:hover:text-white dark:text-slate-50 dark:hover:text-white dark:text-slate-50 transition-colors pr-2">{ann.content}</p>
                    </div>
                    {isAdmin && (
                      <button onClick={() => deleteAnnMutation.mutate(ann._id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 pt-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No announcements at this time.</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {showAgreementModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={handleDisagree}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg clean-panel bg-white dark:bg-slate-800 shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              <div className="bg-slate-200 dark:bg-slate-700 px-6 py-4 border-b border-slate-300 dark:border-slate-600 flex justify-center items-center">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Important Instructions</h3>
              </div>
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle className="w-8 h-8 text-brand-accent dark:text-blue-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Before you join...</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Please do not attempt to record this relay using any device. Taking clips, photos, or engaging in any kind of mischief is strictly prohibited. 
                  Any violation will result in immediate termination of your access to the relay.
                </p>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-4 justify-end border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={handleDisagree}
                  className="px-6 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:bg-slate-900/50 transition-colors w-full sm:w-auto shadow-sm"
                >
                  I Decline
                </button>
                <button
                  onClick={handleAgree}
                  className="btn-primary px-8 py-2.5 w-full sm:w-auto"
                >
                  I Agree
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RelayPage;
