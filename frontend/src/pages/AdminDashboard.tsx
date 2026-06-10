import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Server, Radio, Plus, Trash2, Link as LinkIcon, Edit2, X, LifeBuoy, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiClient } from '../api/apiClient';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stream');
  const queryClient = useQueryClient();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // --- STREAM STATE & MUTATIONS ---
  const [showStreamForm, setShowStreamForm] = useState(false);
  const [editingStreamId, setEditingStreamId] = useState<string | null>(null);
  const [streamFormData, setStreamFormData] = useState({
    title: '', speaker: '', description: '', servers: [{ name: 'Server A', url: '' }], streamType: 'YOUTUBE', thumbnail: ''
  });
  const [streamFormErrors, setStreamFormErrors] = useState<{title?: boolean, speaker?: boolean, servers?: {name?: boolean, url?: boolean}[]}>({});
  const [showStreamTypeDropdown, setShowStreamTypeDropdown] = useState(false);

  const { data: streams, isLoading: isLoadingStreams } = useQuery({
    queryKey: ['streams'],
    queryFn: () => apiClient('/streams'),
  });

  const createStreamMutation = useMutation({
    mutationFn: (data: typeof streamFormData) => apiClient('/streams', {
      method: 'POST', body: JSON.stringify({ ...data, isLive: true }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      setStreamFormData({ title: '', speaker: '', description: '', servers: [{ name: 'Server A', url: '' }], streamType: 'YOUTUBE', thumbnail: '' });
      toast.success('Stream created successfully!');
    },
    onError: () => toast.error('Failed to create stream.')
  });

  const updateStreamMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<typeof streamFormData> }) => apiClient(`/streams/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      setStreamFormData({ title: '', speaker: '', description: '', servers: [{ name: 'Server A', url: '' }], streamType: 'YOUTUBE', thumbnail: '' });
      setEditingStreamId(null);
      toast.success('Stream updated successfully!');
    },
    onError: () => toast.error('Failed to update stream.')
  });

  const toggleLiveMutation = useMutation({
    mutationFn: ({ id, isLive }: { id: string, isLive: boolean }) => apiClient(`/streams/${id}`, { 
      method: 'PUT', body: JSON.stringify({ isLive }) 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      toast.success('Stream live status updated!');
    },
    onError: () => toast.error('Failed to update live status.')
  });

  const deleteStreamMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/streams/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      toast.success('Stream deleted!');
    },
    onError: () => toast.error('Failed to delete stream.')
  });

  const handleStreamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value;
    
    // Automatically convert Google Drive links to direct image links for thumbnails
    if (e.target.name === 'thumbnail' && value.includes('drive.google.com')) {
      const match = value.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/);
      if (match) {
        value = `https://lh3.googleusercontent.com/d/${match[1]}`;
      }
    }

    setStreamFormData({ ...streamFormData, [e.target.name]: value });
    if (streamFormErrors[e.target.name as keyof typeof streamFormErrors]) {
      setStreamFormErrors({ ...streamFormErrors, [e.target.name]: false });
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB to keep database fast.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setStreamFormData({ ...streamFormData, thumbnail: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleServerChange = (index: number, field: 'name' | 'url', value: string) => {
    const newServers = [...streamFormData.servers];
    newServers[index][field] = value;
    setStreamFormData({ ...streamFormData, servers: newServers });
    
    // Clear server specific error if user is typing
    if (streamFormErrors.servers && streamFormErrors.servers[index] && streamFormErrors.servers[index][field]) {
      const newServerErrors = [...streamFormErrors.servers];
      newServerErrors[index] = { ...newServerErrors[index], [field]: false };
      setStreamFormErrors({ ...streamFormErrors, servers: newServerErrors });
    }
  };

  const addServer = () => {
    setStreamFormData({
      ...streamFormData,
      servers: [...streamFormData.servers, { name: `Server ${String.fromCharCode(65 + streamFormData.servers.length)}`, url: '' }]
    });
  };

  const removeServer = (index: number) => {
    const newServers = streamFormData.servers.filter((_, i) => i !== index);
    setStreamFormData({ ...streamFormData, servers: newServers });
  };

  const handleStreamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStreamFormErrors({});
    let hasErrors = false;
    const newErrors = { 
      title: !streamFormData.title.trim(), 
      speaker: !streamFormData.speaker.trim(), 
      servers: streamFormData.servers.map(s => {
        const sErr = { name: !s.name.trim(), url: !s.url.trim() };
        if (sErr.name || sErr.url) hasErrors = true;
        return sErr;
      }) 
    };
    if (newErrors.title || newErrors.speaker) hasErrors = true;

    if (hasErrors) {
      setStreamFormErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingStreamId) {
      updateStreamMutation.mutate({ id: editingStreamId, data: streamFormData });
    } else {
      createStreamMutation.mutate(streamFormData);
    }
  };

  const handleEditStream = (stream: any) => {
    setStreamFormData({
      title: stream.title,
      speaker: stream.speaker,
      description: stream.description,
      servers: stream.servers?.length ? stream.servers : [{ name: 'Server A', url: stream.streamUrl || '' }],
      streamType: stream.streamType,
      thumbnail: stream.thumbnail || ''
    });
    setEditingStreamId(stream._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- USER STATE & MUTATIONS ---
  const [showUserForm, setShowUserForm] = useState(false);
  const [userFormData, setUserFormData] = useState({
    itsId: '', fullName: '', email: '', mobile: '', password: '', role: 'USER'
  });
  const [userFormErrors, setUserFormErrors] = useState<{itsId?: boolean, fullName?: boolean, email?: boolean, mobile?: boolean}>({});

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient('/users'),
  });

  const { data: queries, isLoading: isLoadingQueries } = useQuery({
    queryKey: ['supportQueries'],
    queryFn: () => apiClient('/support'),
  });

  const deleteQueryMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/support/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportQueries'] });
      toast.success('Support query deleted!');
    },
    onError: () => toast.error('Failed to delete query.')
  });

  const createUserMutation = useMutation({
    mutationFn: (data: typeof userFormData) => apiClient('/users', {
      method: 'POST', body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserFormData({ itsId: '', fullName: '', email: '', mobile: '', password: '', role: 'USER' });
      setShowUserForm(false);
      toast.success('User created successfully!');
    },
    onError: () => toast.error('Failed to create user.')
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) => apiClient(`/users/${id}`, {
      method: 'PUT', body: JSON.stringify({ isActive }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User status updated!');
    },
    onError: () => toast.error('Failed to update user status.')
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted!');
    },
    onError: () => toast.error('Failed to delete user.')
  });

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setUserFormData({ ...userFormData, [e.target.name]: e.target.value });
    if (userFormErrors[e.target.name as keyof typeof userFormErrors]) {
      setUserFormErrors({ ...userFormErrors, [e.target.name]: false });
    }
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormErrors({});
    let hasErrors = false;
    const newErrors = {
      itsId: !userFormData.itsId.trim(),
      fullName: !userFormData.fullName.trim(),
      email: !userFormData.email.trim(),
      mobile: !userFormData.mobile.trim()
    };
    if (newErrors.itsId || newErrors.fullName || newErrors.email || newErrors.mobile) hasErrors = true;

    if (hasErrors) {
      setUserFormErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }
    createUserMutation.mutate(userFormData);
  };


  return (
    <>
      <div className="flex flex-1 items-start relative">
        <aside className="w-64 border-r border-slate-200 bg-slate-50 p-6 hidden md:block sticky top-0 self-start">
          <nav className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3">Management</div>
            <button onClick={() => setActiveTab('stream')} className={`w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'stream' ? 'bg-sky-50 text-brand-accent border border-sky-100 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
              <Radio className="w-4 h-4 mr-3" /> Live Stream
            </button>
            <button onClick={() => setActiveTab('users')} className={`w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-sky-50 text-brand-accent border border-sky-100 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
              <Users className="w-4 h-4 mr-3" /> Members
            </button>
            <button onClick={() => setActiveTab('queries')} className={`w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'queries' ? 'bg-sky-50 text-brand-accent border border-sky-100 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
              <LifeBuoy className="w-4 h-4 mr-3" /> Support Queries
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-4xl pb-10">
            
            {/* STREAMS TAB */}
            {activeTab === 'stream' && (
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight mb-2 text-brand-accent">Live Stream Controls</h2>
                    <p className="text-slate-500 text-sm">Create new relays and manage the active video feed.</p>
                  </div>
                  <motion.button 
                    layout
                    onClick={() => {
                      if (editingStreamId) {
                        setEditingStreamId(null);
                        setStreamFormData({ title: '', speaker: '', description: '', servers: [{ name: 'Server A', url: '' }], streamType: 'YOUTUBE', thumbnail: '' });
                        setShowStreamForm(false);
                      } else {
                        setShowStreamForm(!showStreamForm);
                      }
                    }} 
                    className="btn-primary flex items-center shadow-sm overflow-hidden min-h-[38px] px-4"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={(showStreamForm || editingStreamId) ? 'close' : 'add'}
                        initial={{ opacity: 0, scale: 0.9, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center whitespace-nowrap"
                      >
                        {(showStreamForm || editingStreamId) ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />} 
                        {(showStreamForm || editingStreamId) ? 'Close Form' : 'Create Relay'}
                      </motion.div>
                    </AnimatePresence>
                  </motion.button>
                </div>

                <AnimatePresence>
                  {(showStreamForm || editingStreamId) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -20 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -20, margin: 0, padding: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <form onSubmit={handleStreamSubmit} className="clean-panel p-8 relative">
                        {editingStreamId && (
                          <button 
                            type="button" 
                            onClick={() => {
                              setEditingStreamId(null);
                              setStreamFormData({ title: '', speaker: '', description: '', servers: [{ name: 'Server A', url: '' }], streamType: 'YOUTUBE', thumbnail: '' });
                              setShowStreamForm(false);
                            }}
                            className="absolute top-8 right-8 text-xs font-medium text-slate-500 hover:text-slate-800"
                          >
                            Cancel Edit
                          </button>
                        )}
                        <h3 className="text-lg font-medium mb-4">{editingStreamId ? 'Edit Relay' : 'Create New Relay'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Stream Title</label>
                            <input type="text" name="title" value={streamFormData.title} onChange={handleStreamChange} className={`input-field ${streamFormErrors.title ? 'border-red-500 bg-red-50 animate-gentle-shake' : ''}`} placeholder="e.g. Lailatul Qadr Bayaan" />
                            {streamFormErrors.title && <p className="text-red-500 text-xs px-1">Stream Title is required</p>}
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Speaker Name</label>
                            <input type="text" name="speaker" value={streamFormData.speaker} onChange={handleStreamChange} className={`input-field ${streamFormErrors.speaker ? 'border-red-500 bg-red-50 animate-gentle-shake' : ''}`} placeholder="e.g. Syedi Mukasir Saheb" />
                            {streamFormErrors.speaker && <p className="text-red-500 text-xs px-1">Speaker Name is required</p>}
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Description (Optional)</label>
                            <input type="text" name="description" value={streamFormData.description} onChange={handleStreamChange} className="input-field" placeholder="Description of the event" />
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Stream Type Architecture</label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowStreamTypeDropdown(!showStreamTypeDropdown)}
                                className="w-full input-field flex justify-between items-center bg-white cursor-pointer hover:border-brand-accent transition-colors"
                              >
                                <div className="flex items-center">
                                  {streamFormData.streamType === 'YOUTUBE' ? (
                                    <span className="flex items-center"><LinkIcon className="w-4 h-4 mr-2 text-red-500" /> YouTube / External Player</span>
                                  ) : (
                                    <span className="flex items-center"><Server className="w-4 h-4 mr-2 text-sky-500" /> Secure Proxy (HLS / RTMP)</span>
                                  )}
                                </div>
                                <motion.div animate={{ rotate: showStreamTypeDropdown ? 180 : 0 }} className="text-slate-400 flex items-center justify-center">
                                  <ChevronDown className="w-4 h-4" />
                                </motion.div>
                              </button>
                              
                              <AnimatePresence>
                                {showStreamTypeDropdown && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
                                  >
                                    <div 
                                      onClick={() => {
                                        setStreamFormData({...streamFormData, streamType: 'YOUTUBE'});
                                        setShowStreamTypeDropdown(false);
                                      }}
                                      className={`p-4 cursor-pointer transition-colors border-b border-slate-100 flex items-start ${streamFormData.streamType === 'YOUTUBE' ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                                    >
                                      <LinkIcon className={`w-5 h-5 mt-0.5 mr-3 ${streamFormData.streamType === 'YOUTUBE' ? 'text-red-500' : 'text-slate-400'}`} />
                                      <div>
                                        <div className={`font-semibold ${streamFormData.streamType === 'YOUTUBE' ? 'text-slate-900' : 'text-slate-700'}`}>YouTube / External Link</div>
                                        <div className="text-xs text-slate-500 mt-1">Standard embedded player. Best for public youtube links or Google Drive.</div>
                                      </div>
                                    </div>
                                    <div 
                                      onClick={() => {
                                        setStreamFormData({...streamFormData, streamType: 'HLS'});
                                        setShowStreamTypeDropdown(false);
                                      }}
                                      className={`p-4 cursor-pointer transition-colors flex items-start ${streamFormData.streamType === 'HLS' ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                                    >
                                      <Server className={`w-5 h-5 mt-0.5 mr-3 ${streamFormData.streamType === 'HLS' ? 'text-sky-500' : 'text-slate-400'}`} />
                                      <div>
                                        <div className={`font-semibold ${streamFormData.streamType === 'HLS' ? 'text-slate-900' : 'text-slate-700'}`}>Secure Proxy (HLS / RTMP)</div>
                                        <div className="text-xs text-slate-500 mt-1">Premium custom player. Hides origin URLs from users using tokens.</div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Thumbnail (Optional)</label>
                            <div className="flex gap-4 items-center">
                              <input 
                                type="text" 
                                name="thumbnail" 
                                value={streamFormData.thumbnail.startsWith('data:image') ? '(Local File Uploaded)' : streamFormData.thumbnail} 
                                onChange={handleStreamChange} 
                                disabled={streamFormData.thumbnail.startsWith('data:image')}
                                className={`input-field flex-1 ${streamFormData.thumbnail.startsWith('data:image') ? 'text-slate-400 bg-slate-50 cursor-not-allowed' : ''}`} 
                                placeholder="Paste image URL here..." 
                              />
                              <span className="text-xs font-bold text-slate-400 uppercase">OR</span>
                              <div className="relative">
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={handleThumbnailUpload} 
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                />
                                <button type="button" className="btn-secondary whitespace-nowrap text-xs py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors font-semibold">
                                  Upload File
                                </button>
                              </div>
                            </div>
                            {streamFormData.thumbnail && (
                              <div className="mt-3 relative w-32 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                                <img src={streamFormData.thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setStreamFormData({...streamFormData, thumbnail: ''})} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition-colors">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="md:col-span-2 pt-4 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-4">
                              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Server Connections</label>
                              <button type="button" onClick={addServer} className="text-xs font-medium text-brand-accent hover:text-brand-accent-hover flex items-center bg-sky-50 px-3 py-1.5 rounded-full border border-sky-100">
                                <Plus className="w-3 h-3 mr-1" /> Add Server
                              </button>
                            </div>

                            <div className="space-y-3">
                              {streamFormData.servers.map((server, idx) => (
                                <div key={idx} className="flex gap-3 items-center bg-slate-50/50 p-3 rounded-lg border border-slate-200">
                                  <div className="w-1/3">
                                    <input 
                                      type="text" 
                                      value={server.name} 
                                      onChange={(e) => handleServerChange(idx, 'name', e.target.value)} 
                                      className={`input-field py-2 ${streamFormErrors.servers?.[idx]?.name ? 'border-red-500 bg-red-50 animate-gentle-shake' : ''}`} 
                                      placeholder="e.g. Server A"
                                    />
                                    {streamFormErrors.servers?.[idx]?.name && <p className="text-red-500 text-xs px-1 mt-1">Server name is required</p>}
                                  </div>
                                  <div className="flex-1">
                                    <input 
                                      type="text" 
                                      value={server.url} 
                                      onChange={(e) => handleServerChange(idx, 'url', e.target.value)} 
                                      className={`input-field py-2 font-mono text-xs ${streamFormErrors.servers?.[idx]?.url ? 'border-red-500 bg-red-50 animate-gentle-shake' : ''}`} 
                                      placeholder="Live Link URL..."
                                    />
                                    {streamFormErrors.servers?.[idx]?.url && <p className="text-red-500 text-xs px-1 mt-1">URL is required</p>}
                                  </div>
                                  {streamFormData.servers.length > 1 && (
                                    <button type="button" onClick={() => removeServer(idx)} className="text-slate-400 hover:text-red-500 p-2">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="md:col-span-2 flex items-center justify-between pt-6 border-t border-slate-200 mt-2">
                            <button type="submit" disabled={createStreamMutation.isPending || updateStreamMutation.isPending} className="btn-primary">
                              {editingStreamId 
                                ? (updateStreamMutation.isPending ? 'Saving...' : 'Save Changes')
                                : (createStreamMutation.isPending ? 'Creating...' : 'Create & Go Live')
                              }
                            </button>
                          </div>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="clean-panel overflow-x-auto mt-8">
                  <div className="p-4 border-b border-slate-200"><h3 className="text-lg font-medium">Relay History</h3></div>
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-200 border-b border-slate-300 text-xs uppercase tracking-wider text-slate-600 font-semibold">
                      <tr><th className="px-6 py-4">Title</th><th className="px-6 py-4">Speaker</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {isLoadingStreams ? (
                        <tr><td colSpan={4} className="px-6 py-4 text-center">Loading streams...</td></tr>
                      ) : streams?.map((stream: any) => (
                        <tr key={stream._id} className={`hover:bg-slate-50 transition-colors ${editingStreamId === stream._id ? 'bg-sky-50' : ''}`}>
                          <td className="px-6 py-4 font-medium text-slate-900">{stream.title}</td>
                          <td className="px-6 py-4">{stream.speaker}</td>
                          <td className="px-6 py-4">
                            {stream.isLive ? (
                              <span className="text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md text-xs font-semibold animate-pulse flex items-center w-max"><span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-2"></span> LIVE</span>
                            ) : (
                              <span className="text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-semibold">Offline</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right space-x-3">
                            {stream.isLive ? (
                              <button onClick={() => toggleLiveMutation.mutate({ id: stream._id, isLive: false })} className="text-slate-600 hover:text-slate-800 text-xs font-medium">Go Offline</button>
                            ) : (
                              <button onClick={() => toggleLiveMutation.mutate({ id: stream._id, isLive: true })} className="text-blue-700 hover:text-blue-900 text-xs font-medium">Go Live</button>
                            )}
                            <button onClick={() => handleEditStream(stream)} className="text-sky-600 hover:text-sky-800 text-xs font-medium">Edit</button>
                            <button onClick={() => {
                              if(window.confirm('Are you sure you want to delete this relay?')) {
                                deleteStreamMutation.mutate(stream._id);
                              }
                            }} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight mb-2 text-brand-accent">Member Directory</h2>
                    <p className="text-slate-500 text-sm">Manage access and view member activity.</p>
                  </div>
                  <motion.button 
                    layout
                    onClick={() => setShowUserForm(!showUserForm)} 
                    className="btn-primary flex items-center shadow-sm overflow-hidden min-h-[38px] px-4"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={showUserForm ? 'close' : 'add'}
                        initial={{ opacity: 0, scale: 0.9, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center whitespace-nowrap"
                      >
                        {showUserForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />} 
                        {showUserForm ? 'Close Form' : 'Add Member'}
                      </motion.div>
                    </AnimatePresence>
                  </motion.button>
                </div>

                <AnimatePresence>
                  {showUserForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -20 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -20, margin: 0, padding: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <form onSubmit={handleUserSubmit} className="clean-panel p-8" noValidate>
                        <h3 className="text-lg font-medium mb-4">Add New Member</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">ITS ID</label>
                            <input type="text" name="itsId" value={userFormData.itsId} onChange={handleUserChange} className={`input-field ${userFormErrors.itsId ? 'border-red-500 bg-red-50 animate-gentle-shake' : ''}`} />
                            {userFormErrors.itsId && <p className="text-red-500 text-xs px-1">ITS ID is required</p>}
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Full Name</label>
                            <input type="text" name="fullName" value={userFormData.fullName} onChange={handleUserChange} className={`input-field ${userFormErrors.fullName ? 'border-red-500 bg-red-50 animate-gentle-shake' : ''}`} />
                            {userFormErrors.fullName && <p className="text-red-500 text-xs px-1">Full Name is required</p>}
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Email</label>
                            <input type="email" name="email" value={userFormData.email} onChange={handleUserChange} className={`input-field ${userFormErrors.email ? 'border-red-500 bg-red-50 animate-gentle-shake' : ''}`} />
                            {userFormErrors.email && <p className="text-red-500 text-xs px-1">Email is required</p>}
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Mobile Number</label>
                            <input type="text" name="mobile" value={userFormData.mobile} onChange={handleUserChange} className={`input-field ${userFormErrors.mobile ? 'border-red-500 bg-red-50 animate-gentle-shake' : ''}`} />
                            {userFormErrors.mobile && <p className="text-red-500 text-xs px-1">Mobile Number is required</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Initial Password</label>
                            <input type="password" name="password" value={userFormData.password} onChange={handleUserChange} className="input-field" placeholder="Leave blank for '1234'" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Role</label>
                            <select name="role" value={userFormData.role} onChange={handleUserChange} className="input-field bg-white">
                              <option value="USER">User</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </div>
                          <div className="md:col-span-2 pt-6 border-t border-slate-200 mt-2">
                            <button type="submit" disabled={createUserMutation.isPending} className="btn-primary">
                              {createUserMutation.isPending ? 'Saving...' : 'Save Member'}
                            </button>
                          </div>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="clean-panel overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-200 border-b border-slate-300 text-xs uppercase tracking-wider text-slate-600 font-semibold">
                      <tr><th className="px-6 py-4">ITS ID</th><th className="px-6 py-4">Full Name</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {isLoadingUsers ? (
                        <tr><td colSpan={5} className="px-6 py-4 text-center">Loading members...</td></tr>
                      ) : users?.map((user: any) => (
                        <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono text-slate-700 font-medium">{user.itsId}</td>
                          <td className="px-6 py-4 text-slate-900">{user.fullName}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${user.role === 'ADMIN' ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${user.isActive ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                              {user.isActive ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-3">
                            <button onClick={() => toggleUserStatusMutation.mutate({ id: user._id, isActive: !user.isActive })} className="text-sky-600 hover:text-sky-800 text-xs font-medium">
                              {user.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button onClick={() => {
                              if (window.confirm(`Are you sure you want to delete ${user.fullName}?`)) {
                                deleteUserMutation.mutate(user._id);
                              }
                            }} className="text-red-500 hover:text-red-700 text-xs font-medium">
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* SUPPORT QUERIES TAB */}
            {activeTab === 'queries' && (
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight mb-2 text-brand-accent">Support Queries</h2>
                    <p className="text-slate-500 text-sm">Review help requests submitted by users.</p>
                  </div>
                </div>

                <div className="clean-panel">
                  <div className="bg-slate-200 px-6 py-4 border-b border-slate-300">
                    <h3 className="text-sm font-semibold text-slate-700">All Submissions</h3>
                  </div>
                  
                  {isLoadingQueries ? (
                    <div className="p-12 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
                    </div>
                  ) : queries?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">City/Town</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Mohalla</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Query</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {queries.map((q: any) => (
                            <tr key={q._id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-500">
                                {new Date(q.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap">
                                <div className="text-sm font-semibold text-slate-800">{q.name}</div>
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-600 font-medium">
                                {q.mobile}
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-500">
                                {q.city}
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-500">
                                {q.mohalla}
                              </td>
                              <td className="py-4 px-6 text-sm text-slate-600 max-w-xs truncate" title={q.query}>
                                {q.query}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button 
                                  onClick={() => {
                                    if(window.confirm('Delete this support query?')) {
                                      deleteQueryMutation.mutate(q._id);
                                    }
                                  }} 
                                  className="text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-400 text-sm">
                      No support queries found.
                    </div>
                  )}
                </div>
              </div>
            )}
            
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;
