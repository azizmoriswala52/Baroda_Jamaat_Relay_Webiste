import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Server, Radio, Plus, Trash2, Link as LinkIcon, Edit2, X, LifeBuoy, ToggleLeft, ToggleRight, ChevronDown, AlertCircle, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { apiClient } from '../api/apiClient';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stream');
  const queryClient = useQueryClient();

  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useDocumentTitle('Admin Control Room');

  // --- STREAM STATE & MUTATIONS ---
  const [showStreamForm, setShowStreamForm] = useState(false);
  const [editingStreamId, setEditingStreamId] = useState<string | null>(null);
  const [streamFormData, setStreamFormData] = useState({
    title: '', speaker: '', description: '', servers: [{ name: 'Server A', url: '' }], streamType: 'YOUTUBE', thumbnail: '', allowedMohalla: 'All'
  });
  const [streamFormErrors, setStreamFormErrors] = useState<{ title?: boolean, speaker?: boolean, servers?: { name?: boolean, url?: boolean }[] }>({});
  const [showStreamTypeDropdown, setShowStreamTypeDropdown] = useState(false);

  const { data: streams, isLoading: isLoadingStreams, refetch: refetchStreams, isFetching: isFetchingStreams } = useQuery({
    queryKey: ['streams'],
    queryFn: () => apiClient('/streams'),
  });

  const createStreamMutation = useMutation({
    mutationFn: (data: typeof streamFormData) => apiClient('/streams', {
      method: 'POST', body: JSON.stringify({ ...data, isLive: true }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      setStreamFormData({ title: '', speaker: '', description: '', servers: [{ name: 'Server A', url: '' }], streamType: 'YOUTUBE', thumbnail: '', allowedMohalla: 'All' });
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
      setStreamFormData({ title: '', speaker: '', description: '', servers: [{ name: 'Server A', url: '' }], streamType: 'YOUTUBE', thumbnail: '', allowedMohalla: 'All' });
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
      thumbnail: stream.thumbnail || '',
      allowedMohalla: stream.allowedMohalla || 'All'
    });
    setEditingStreamId(stream._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- USER STATE & MUTATIONS ---
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userFormData, setUserFormData] = useState({
    itsId: '', fullName: '', email: '', mobile: '', password: '', role: 'USER', mohalla: 'Burhani'
  });
  const [userFormErrors, setUserFormErrors] = useState<{ itsId?: boolean, fullName?: boolean, email?: boolean, mobile?: boolean }>({});

  const [selectedQuery, setSelectedQuery] = useState<any>(null);
  const [selectedLoginIssue, setSelectedLoginIssue] = useState<any>(null);

  const { data: users, isLoading: isLoadingUsers, refetch: refetchUsers, isFetching: isFetchingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient('/users'),
  });

  const { data: queries, isLoading: isLoadingQueries, refetch: refetchQueries, isFetching: isFetchingQueries } = useQuery({
    queryKey: ['supportQueries'],
    queryFn: () => apiClient('/support'),
  });

  const { data: loginIssues, isLoading: isLoadingLoginIssues, refetch: refetchLoginIssues, isFetching: isFetchingLoginIssues } = useQuery({
    queryKey: ['loginIssues'],
    queryFn: () => apiClient('/login-issues'),
  });

  // --- MOHALLA STATE & MUTATIONS ---
  const [showMohallaManager, setShowMohallaManager] = useState(false);
  const [newMohallaName, setNewMohallaName] = useState('');

  const { data: mohallas, isLoading: isLoadingMohallas } = useQuery({
    queryKey: ['mohallas'],
    queryFn: () => apiClient('/mohallas'),
  });

  const createMohallaMutation = useMutation({
    mutationFn: (data: { name: string }) => apiClient('/mohallas', {
      method: 'POST', body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mohallas'] });
      toast.success('Mohalla added successfully!');
      setNewMohallaName('');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add Mohalla')
  });

  const deleteMohallaMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/mohallas/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mohallas'] });
      toast.success('Mohalla deleted!');
    },
    onError: () => toast.error('Failed to delete Mohalla')
  });

  const deleteQueryMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/support/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportQueries'] });
      toast.success('Support query deleted!');
    },
    onError: () => toast.error('Failed to delete query.')
  });

  const deleteLoginIssueMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/login-issues/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loginIssues'] });
      toast.success('Login issue deleted!');
    },
    onError: () => toast.error('Failed to delete login issue.')
  });

  const createUserMutation = useMutation({
    mutationFn: (data: typeof userFormData) => apiClient('/users', {
      method: 'POST', body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserFormData({ itsId: '', fullName: '', email: '', mobile: '', password: '', role: 'USER', mohalla: 'Burhani' });
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

  const forceLogoutUserMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/users/${id}/logout`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User has been forcefully logged out.');
    },
    onError: () => toast.error('Failed to logout user.')
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: typeof userFormData }) => apiClient(`/users/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserFormData({ itsId: '', fullName: '', email: '', mobile: '', password: '', role: 'USER', mohalla: 'Burhani' });
      setShowUserForm(false);
      setEditingUserId(null);
      toast.success('User updated successfully!');
    },
    onError: () => toast.error('Failed to update user.')
  });

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value;
    if (e.target.name === 'itsId') {
      value = value.replace(/\D/g, '').slice(0, 8);
    }
    setUserFormData({ ...userFormData, [e.target.name]: value });
    if (userFormErrors[e.target.name as keyof typeof userFormErrors]) {
      setUserFormErrors({ ...userFormErrors, [e.target.name]: false });
    }
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormErrors({});
    let hasErrors = false;
    const newErrors = {
      itsId: !userFormData.itsId.trim() || !/^\d{8}$/.test(userFormData.itsId.trim()),
      fullName: !userFormData.fullName.trim(),
      mobile: !userFormData.mobile.trim()
    };
    if (newErrors.itsId || newErrors.fullName || newErrors.mobile) hasErrors = true;

    if (hasErrors) {
      setUserFormErrors(newErrors);
      if (newErrors.itsId) {
        toast.error('ITS ID must be exactly 8 digits');
      } else {
        toast.error('Please fill in all required fields');
      }
      return;
    }
    if (editingUserId) {
      updateUserMutation.mutate({ id: editingUserId, data: userFormData });
    } else {
      createUserMutation.mutate(userFormData);
    }
  };

  const handleEditUser = (user: any) => {
    setUserFormData({
      itsId: user.itsId,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      password: '', // Leave empty to not change
      role: user.role,
      mohalla: user.mohalla || 'Burhani'
    });
    setEditingUserId(user._id);
    setShowUserForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  return (
    <>
      <div className="flex flex-col md:flex-row flex-1 items-start relative w-full">
        {/* Mobile Tabs */}
        <div className="w-full md:hidden bg-slate-50 border-b border-slate-200 sticky top-0 z-20">
          <div className="flex overflow-x-auto hide-scrollbar p-3 space-x-2">
            <button onClick={() => setActiveTab('stream')} className={`shrink-0 flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'stream' ? 'bg-sky-100 text-brand-accent shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Radio className="w-4 h-4 mr-2" /> Stream
            </button>
            <button onClick={() => setActiveTab('users')} className={`shrink-0 flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-sky-100 text-brand-accent shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Users className="w-4 h-4 mr-2" /> Members
            </button>
            <button onClick={() => setActiveTab('queries')} className={`shrink-0 flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'queries' ? 'bg-sky-100 text-brand-accent shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
              <LifeBuoy className="w-4 h-4 mr-2" /> Support
            </button>
            <button onClick={() => setActiveTab('login-issues')} className={`shrink-0 flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'login-issues' ? 'bg-sky-100 text-brand-accent shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
              <AlertCircle className="w-4 h-4 mr-2" /> Logins
            </button>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <aside className="w-64 border-r border-slate-200 bg-slate-50 p-6 hidden md:block sticky top-0 self-start max-h-[calc(100vh-10rem)] overflow-y-auto">
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
            <button onClick={() => setActiveTab('login-issues')} className={`w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'login-issues' ? 'bg-sky-50 text-brand-accent border border-sky-100 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
              <AlertCircle className="w-4 h-4 mr-3" /> Login Issues
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-8 w-full max-w-[100vw] overflow-x-hidden">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-4xl pb-10">

            {/* STREAMS TAB */}
            {activeTab === 'stream' && (
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight mb-2 text-brand-accent">Live Stream Controls</h2>
                    <p className="text-slate-500 text-sm">Create new relays and manage the active video feed.</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => refetchStreams()}
                      className="btn-secondary flex items-center shadow-sm overflow-hidden min-h-[38px] px-3 border-slate-300 bg-white hover:bg-slate-50"
                      title="Refresh Streams"
                    >
                      <RefreshCw className={`w-4 h-4 text-slate-600 ${isFetchingStreams ? 'animate-spin text-brand-accent' : ''}`} />
                    </button>
                    <motion.button
                      layout
                      onClick={() => {
                        if (editingStreamId) {
                          setEditingStreamId(null);
                          setStreamFormData({ title: '', speaker: '', description: '', servers: [{ name: 'Server A', url: '' }], streamType: 'YOUTUBE', thumbnail: '', allowedMohalla: 'All' });
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
                              setStreamFormData({ title: '', speaker: '', description: '', servers: [{ name: 'Server A', url: '' }], streamType: 'YOUTUBE', thumbnail: '', allowedMohalla: 'All' });
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
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Waaz karnar</label>
                            <input type="text" name="speaker" value={streamFormData.speaker} onChange={handleStreamChange} className={`input-field ${streamFormErrors.speaker ? 'border-red-500 bg-red-50 animate-gentle-shake' : ''}`} placeholder="e.g. Syedi Mukasir Saheb" />
                            {streamFormErrors.speaker && <p className="text-red-500 text-xs px-1">Waaz karnar is required</p>}
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Description (Optional)</label>
                            <input type="text" name="description" value={streamFormData.description} onChange={handleStreamChange} className="input-field" placeholder="Description of the event" />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Allowed Mohalla</label>
                            <select name="allowedMohalla" value={streamFormData.allowedMohalla} onChange={handleStreamChange} className="input-field bg-white">
                              <option value="All">All</option>
                              {mohallas?.map((m: any) => (
                                <option key={m._id} value={m.name}>{m.name}</option>
                              ))}
                            </select>
                            <p className="text-xs text-slate-400 mt-1">Users not in the selected Mohalla will not be able to view this stream.</p>
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
                                        setStreamFormData({ ...streamFormData, streamType: 'YOUTUBE' });
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
                                        setStreamFormData({ ...streamFormData, streamType: 'HLS' });
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
                                <button type="button" onClick={() => setStreamFormData({ ...streamFormData, thumbnail: '' })} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition-colors">
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
                      <tr><th className="px-6 py-4">Title</th><th className="px-6 py-4">Waaz karnar</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
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
                              if (window.confirm('Are you sure you want to delete this relay?')) {
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
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowMohallaManager(!showMohallaManager)}
                      className="btn-secondary flex items-center shadow-sm overflow-hidden min-h-[38px] px-4 bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Manage Mohallas
                    </button>
                    <button
                      onClick={() => refetchUsers()}
                      className="btn-secondary flex items-center shadow-sm overflow-hidden min-h-[38px] px-3 border-slate-300 bg-white hover:bg-slate-50"
                      title="Refresh Members"
                    >
                      <RefreshCw className={`w-4 h-4 text-slate-600 ${isFetchingUsers ? 'animate-spin text-brand-accent' : ''}`} />
                    </button>
                    <motion.button
                      layout
                      onClick={() => {
                        if (showUserForm) {
                          setShowUserForm(false);
                          setEditingUserId(null);
                          setUserFormData({ itsId: '', fullName: '', email: '', mobile: '', password: '', role: 'USER', mohalla: 'Burhani' });
                        } else {
                          setShowUserForm(true);
                        }
                      }}
                      className="btn-primary flex items-center shadow-sm overflow-hidden min-h-[38px] px-4"
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={showUserForm ? 'close' : 'add'}
                          initial={{ opacity: 0, rotate: -90 }}
                          animate={{ opacity: 1, rotate: 0 }}
                          exit={{ opacity: 0, rotate: 90 }}
                          transition={{ duration: 0.15 }}
                        >
                          {showUserForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        </motion.div>
                      </AnimatePresence>
                      {showUserForm ? 'Close' : 'Add Member'}
                    </motion.button>
                  </div>
                </div>

                <AnimatePresence>
                  {showMohallaManager && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -20 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -20, margin: 0, padding: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="clean-panel p-6 bg-purple-50/50 border-purple-100 mb-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-purple-900">Manage Mohallas</h3>
                          <button onClick={() => setShowMohallaManager(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex gap-4 mb-6">
                          <input 
                            type="text" 
                            value={newMohallaName} 
                            onChange={(e) => setNewMohallaName(e.target.value)} 
                            placeholder="Enter new Mohalla name..." 
                            className="input-field flex-1 max-w-sm bg-white"
                          />
                          <button 
                            onClick={() => {
                              if (newMohallaName.trim()) createMohallaMutation.mutate({ name: newMohallaName });
                            }} 
                            disabled={createMohallaMutation.isPending || !newMohallaName.trim()}
                            className="btn-primary bg-purple-600 hover:bg-purple-700 shadow-purple-600/20"
                          >
                            {createMohallaMutation.isPending ? 'Adding...' : 'Add Mohalla'}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {isLoadingMohallas ? (
                            <span className="text-sm text-slate-500">Loading...</span>
                          ) : mohallas?.map((m: any) => (
                            <div key={m._id} className="flex items-center bg-white border border-purple-200 rounded-full pl-3 pr-1 py-1 shadow-sm">
                              <span className="text-sm font-medium text-purple-800 mr-2">{m.name}</span>
                              <button 
                                onClick={() => {
                                  if (window.confirm(`Delete ${m.name}? This might break existing users assigned to it.`)) {
                                    deleteMohallaMutation.mutate(m._id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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
                            <input type="text" name="itsId" value={userFormData.itsId} onChange={handleUserChange} onBlur={(e) => {
                              if (!/^\d{8}$/.test(e.target.value.trim())) {
                                setUserFormErrors((prev) => ({ ...prev, itsId: true }));
                              }
                            }} placeholder="8-digit ITS Number" className={`input-field ${userFormErrors.itsId ? 'border-red-500 bg-red-50 animate-gentle-shake' : ''}`} />
                            {userFormErrors.itsId && <p className="text-red-500 text-xs px-1">ITS ID must be exactly 8 digits</p>}
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Full Name</label>
                            <input type="text" name="fullName" value={userFormData.fullName} onChange={handleUserChange} className={`input-field ${userFormErrors.fullName ? 'border-red-500 bg-red-50 animate-gentle-shake' : ''}`} />
                            {userFormErrors.fullName && <p className="text-red-500 text-xs px-1">Full Name is required</p>}
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Email</label>
                            <input type="email" name="email" value={userFormData.email} onChange={handleUserChange} className="input-field" placeholder="Optional" />
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
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Mohalla</label>
                            <select name="mohalla" value={userFormData.mohalla} onChange={handleUserChange} className="input-field bg-white">
                              {mohallas?.map((m: any) => (
                                <option key={m._id} value={m.name}>{m.name}</option>
                              ))}
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
                      <tr>
                        <th className="px-4 py-4 whitespace-nowrap">ITS ID</th>
                        <th className="px-4 py-4 whitespace-nowrap">Member</th>
                        <th className="px-4 py-4 whitespace-nowrap">Mohallah</th>
                        <th className="px-4 py-4 whitespace-nowrap">Email</th>
                        <th className="px-4 py-4 whitespace-nowrap">Mobile NO.</th>
                        <th className="px-4 py-4 whitespace-nowrap">Session Status</th>
                        <th className="px-4 py-4 whitespace-nowrap">IP & Device</th>
                        <th className="px-4 py-4 whitespace-nowrap">Logged In</th>
                        <th className="px-4 py-4 text-right whitespace-nowrap border-l border-slate-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {isLoadingUsers ? (
                        <tr><td colSpan={8} className="px-6 py-4 text-center">Loading members...</td></tr>
                      ) : users?.map((user: any) => (
                        <tr key={user._id} className="group hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4 font-mono text-slate-700 font-medium">{user.itsId}</td>
                          <td className="px-4 py-4">
                            <div className="text-slate-900 font-semibold">{user.fullName}</div>
                            <div className="flex items-center space-x-2 mt-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${user.role === 'ADMIN' ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>
                                {user.role}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${user.isActive ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                                {user.isActive ? 'ACTIVE' : 'DISABLED'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold border text-purple-700 bg-purple-50 border-purple-200">
                              {user.mohalla || 'Burhani'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                            {user.email || <span className="text-slate-400 italic">N/A</span>}
                          </td>
                          <td className="px-4 py-4 text-sm font-mono text-slate-700 whitespace-nowrap">
                            {user.mobile || <span className="text-slate-400 italic font-sans">N/A</span>}
                          </td>
                          <td className="px-4 py-4">
                            {user.sessionStatus === 'inUse' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5 animate-pulse"></span>
                                In Use
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                                Idle
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 max-w-[200px]">
                            <div className="text-xs font-mono text-slate-800 mb-1">{user.lastIpAddress || 'N/A'}</div>
                            <div className="text-[10px] text-slate-500 leading-tight truncate" title={user.lastDeviceDetails || 'N/A'}>
                              {user.lastDeviceDetails || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {user.lastLogin ? (
                              <>
                                <div className="text-xs text-slate-800">{new Date(user.lastLogin).toLocaleDateString()} {new Date(user.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                {user.sessionStatus === 'inUse' && user.sessionDuration !== null && (
                                  <div className="text-xs text-blue-600 font-medium mt-0.5">({user.sessionDuration} mins)</div>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-slate-400">Never</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right space-x-3 whitespace-nowrap border-l border-slate-200">
                            <button onClick={() => {
                              if (user.isActive) {
                                if (window.confirm(`Do you want to deactivate user ${user.fullName}?`)) {
                                  toggleUserStatusMutation.mutate({ id: user._id, isActive: false });
                                }
                              } else {
                                toggleUserStatusMutation.mutate({ id: user._id, isActive: true });
                              }
                            }} className="text-sky-600 hover:text-sky-800 text-xs font-medium">
                              {user.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button onClick={() => handleEditUser(user)} className="text-sky-600 hover:text-sky-800 text-xs font-medium">
                              Edit
                            </button>
                            <button onClick={() => {
                              if (window.confirm(`Are you sure you want to delete ${user.fullName}?`)) {
                                deleteUserMutation.mutate(user._id);
                              }
                            }} className="text-red-500 hover:text-red-700 text-xs font-medium">
                              Delete
                            </button>
                            {user.sessionStatus === 'inUse' && (
                              <button onClick={() => {
                                if (window.confirm(`Forcefully log out ${user.fullName}? They will be immediately disconnected.`)) {
                                  forceLogoutUserMutation.mutate(user._id);
                                }
                              }} className="text-orange-500 hover:text-orange-700 text-xs font-medium ml-3 border-l border-slate-200 pl-3">
                                Logout User
                              </button>
                            )}
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
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => refetchQueries()}
                      className="btn-secondary flex items-center shadow-sm overflow-hidden min-h-[38px] px-3 border-slate-300 bg-white hover:bg-slate-50"
                      title="Refresh Queries"
                    >
                      <RefreshCw className={`w-4 h-4 text-slate-600 ${isFetchingQueries ? 'animate-spin text-brand-accent' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="clean-panel">
                  <div className="bg-slate-200 px-6 py-4 border-b border-slate-300 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-700">
                      {selectedQuery ? 'Query Details' : 'All Submissions'}
                    </h3>
                    {selectedQuery && (
                      <button onClick={() => setSelectedQuery(null)} className="btn-secondary text-sm font-medium flex items-center px-3 py-1.5 bg-white border-slate-300 shadow-sm hover:bg-slate-50">
                        &larr; Back to List
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <AnimatePresence mode="wait">
                      {isLoadingQueries ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-12 flex justify-center w-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
                        </motion.div>
                      ) : selectedQuery ? (
                        <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="w-full">
                          <div className="p-6 sm:p-10">
                            <div className="flex justify-between items-start mb-8">
                              <h3 className="text-2xl font-bold text-slate-800">{selectedQuery.name}</h3>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Delete this support query?')) {
                                    deleteQueryMutation.mutate(selectedQuery._id);
                                    setSelectedQuery(null);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors shadow-sm flex items-center shrink-0 ml-4"
                                title="Delete Query"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">Delete</span>
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                              <div>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Date Submitted</span>
                                <span className="text-sm font-medium text-slate-800">{new Date(selectedQuery.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">ITS ID</span>
                                <span className="text-sm font-medium text-brand-accent font-mono">{selectedQuery.itsId}</span>
                              </div>
                              <div>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Mobile</span>
                                <span className="text-sm font-medium text-slate-800">{selectedQuery.mobile}</span>
                              </div>
                              <div>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">City/Town</span>
                                <span className="text-sm font-medium text-slate-800">{selectedQuery.city}</span>
                              </div>
                              <div>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Mohalla</span>
                                <span className="text-sm font-medium text-slate-800">{selectedQuery.mohalla}</span>
                              </div>
                            </div>

                            <div>
                              <span className="text-sm font-bold text-slate-800 block mb-3">Full Query Description</span>
                              <div className="bg-white border border-slate-200 rounded-xl p-6 whitespace-pre-wrap break-words text-slate-700 leading-relaxed shadow-sm min-h-[150px]">
                                {selectedQuery.query}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : queries?.length > 0 ? (
                        <motion.div key="table" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="w-full">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">ITS ID</th>
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
                                  <tr key={q._id} onClick={() => setSelectedQuery(q)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                                    <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-500">
                                      {new Date(q.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 px-6 whitespace-nowrap text-sm font-mono text-brand-accent font-medium">
                                      {q.itsId}
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
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (window.confirm('Delete this support query?')) {
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
                        </motion.div>
                      ) : (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-12 text-center text-slate-500 border-t border-slate-100 w-full">
                          No support queries yet.
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}

            {/* LOGIN ISSUES TAB */}
            {activeTab === 'login-issues' && (
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight mb-2 text-brand-accent">Login Issues</h2>
                    <p className="text-slate-500 text-sm">Review issues from users unable to login.</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => refetchLoginIssues()}
                      className="btn-secondary flex items-center shadow-sm overflow-hidden min-h-[38px] px-3 border-slate-300 bg-white hover:bg-slate-50"
                      title="Refresh Login Issues"
                    >
                      <RefreshCw className={`w-4 h-4 text-slate-600 ${isFetchingLoginIssues ? 'animate-spin text-brand-accent' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="clean-panel">
                  <div className="bg-slate-200 px-6 py-4 border-b border-slate-300 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-700">
                      {selectedLoginIssue ? 'Issue Details' : 'All Submissions'}
                    </h3>
                    {selectedLoginIssue && (
                      <button onClick={() => setSelectedLoginIssue(null)} className="btn-secondary text-sm font-medium flex items-center px-3 py-1.5 bg-white border-slate-300 shadow-sm hover:bg-slate-50">
                        &larr; Back to List
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <AnimatePresence mode="wait">
                      {isLoadingLoginIssues ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-12 flex justify-center w-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
                        </motion.div>
                      ) : selectedLoginIssue ? (
                        <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="w-full">
                          <div className="p-6 sm:p-10">
                            <div className="flex justify-between items-start mb-8">
                              <h3 className="text-2xl font-bold text-slate-800">ITS Number: <span className="font-mono text-brand-accent">{selectedLoginIssue.itsId}</span></h3>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Delete this login issue?')) {
                                    deleteLoginIssueMutation.mutate(selectedLoginIssue._id);
                                    setSelectedLoginIssue(null);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors shadow-sm flex items-center shrink-0 ml-4"
                                title="Delete Login Issue"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">Delete</span>
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                              <div>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Date Submitted</span>
                                <span className="text-sm font-medium text-slate-800">{new Date(selectedLoginIssue.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div>
                              <span className="text-sm font-bold text-slate-800 block mb-3">Full Issue Description</span>
                              <div className="bg-white border border-slate-200 rounded-xl p-6 whitespace-pre-wrap break-words text-slate-700 leading-relaxed shadow-sm min-h-[150px]">
                                {selectedLoginIssue.issueDescription}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : loginIssues?.length > 0 ? (
                        <motion.div key="table" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="w-full">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">ITS Number</th>
                                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Issue Description</th>
                                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {loginIssues.map((issue: any) => (
                                  <tr key={issue._id} onClick={() => setSelectedLoginIssue(issue)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                                    <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-500">
                                      {new Date(issue.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 px-6 whitespace-nowrap">
                                      <div className="text-sm font-semibold text-slate-800 font-mono">{issue.itsId}</div>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-slate-600 max-w-sm truncate" title={issue.issueDescription}>
                                      {issue.issueDescription}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (window.confirm('Delete this login issue?')) {
                                            deleteLoginIssueMutation.mutate(issue._id);
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
                        </motion.div>
                      ) : (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-12 text-center text-slate-500 border-t border-slate-100 w-full">
                          No login issues reported.
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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
