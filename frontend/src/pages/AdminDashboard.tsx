/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Server, Radio, Plus, Trash2, Link as LinkIcon, Edit2, X, LifeBuoy, ToggleLeft, ToggleRight, ChevronDown, AlertCircle, RefreshCw, LogOut, Search, Megaphone } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { apiClient } from '../api/apiClient';
import CustomDropdown from '../components/CustomDropdown';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import { useConfirm } from '../contexts/ConfirmContext';
import AdminAnnouncementsTab from './AdminAnnouncementsTab';

const AdminDashboard = () => {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState('stream');
  const queryClient = useQueryClient();

  const userStr = sessionStorage.getItem('user');

  useDocumentTitle('Admin Control Room');

  const [searchItsId, setSearchItsId] = useState('');

  // --- STREAM STATE & MUTATIONS ---
  const [showStreamForm, setShowStreamForm] = useState(false);
  const [editingStreamId, setEditingStreamId] = useState<string | null>(null);
  const defaultStreamData = { title: '', speaker: '', description: '', servers: [{ name: 'Server A', url: '' }], streamType: 'HLS' as 'YOUTUBE' | 'HLS' | 'RTMP', thumbnail: '', allowedParentMohallas: ['All'], allowedChildMohallas: ['All'], allowedGender: 'All', visibility: 'ADMIN' };
  const [streamFormData, setStreamFormData] = useState(defaultStreamData);
  const [initialStreamFormData, setInitialStreamFormData] = useState(defaultStreamData);
  const [streamFormErrors, setStreamFormErrors] = useState<{ title?: boolean, speaker?: boolean, servers?: { name?: boolean, url?: boolean }[] }>({});
  const [showStreamTypeDropdown, setShowStreamTypeDropdown] = useState(false);

  const { data: streams, isLoading: isLoadingStreams, refetch: refetchStreams, isFetching: isFetchingStreams } = useQuery({
    queryKey: ['streams'],
    queryFn: () => apiClient('/streams'),
    refetchInterval: 5000,
  });

  const createStreamMutation = useMutation({
    mutationFn: (data: typeof streamFormData & { isLive?: boolean }) => apiClient('/streams', {
      method: 'POST', body: JSON.stringify({ ...data, isLive: data.isLive ?? true }),
    }),
    onMutate: async (newStream) => {
      await queryClient.cancelQueries({ queryKey: ['streams'] });
      const previousStreams = queryClient.getQueryData(['streams']);
      queryClient.setQueryData(['streams'], (old: any) => {
        const optimistic = { ...newStream, _id: `temp-${Date.now()}`, isLive: newStream.isLive ?? true };
        return old ? [optimistic, ...old] : [optimistic];
      });
      setStreamFormData({ title: '', speaker: '', description: '', servers: [{ name: 'Server A', url: '' }], streamType: 'HLS', thumbnail: '', allowedParentMohallas: ['All'], allowedChildMohallas: ['All'], allowedGender: 'All', visibility: 'ADMIN' });
      return { previousStreams };
    },
    onSuccess: () => {
      toast.success('Stream created successfully!');
    },
    onError: (err, variables, context: any) => {
      if (context?.previousStreams) {
        queryClient.setQueryData(['streams'], context.previousStreams);
      }
      toast.error('Failed to create stream.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      queryClient.invalidateQueries({ queryKey: ['activeStream'] });
    }
  });

  const updateStreamMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => apiClient(`/streams/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      queryClient.invalidateQueries({ queryKey: ['activeStream'] });
      setStreamFormData({ title: '', speaker: '', description: '', servers: [{ name: 'Server A', url: '' }], streamType: 'HLS', thumbnail: '', allowedParentMohallas: ['All'], allowedChildMohallas: ['All'], allowedGender: 'All', visibility: 'ADMIN' });
      setEditingStreamId(null);
      toast.success('Stream updated successfully!');
    },
    onError: () => toast.error('Failed to update stream.')
  });

  const toggleLiveMutation = useMutation({
    mutationFn: ({ id, isLive }: { id: string, isLive: boolean }) => apiClient(`/streams/${id}`, {
      method: 'PUT', body: JSON.stringify({ isLive })
    }),
    onMutate: async ({ id, isLive }) => {
      await queryClient.cancelQueries({ queryKey: ['streams'] });
      const previousStreams = queryClient.getQueryData(['streams']);
      queryClient.setQueryData(['streams'], (old: any) =>
        old?.map((stream: any) => stream._id === id ? { ...stream, isLive } : stream)
      );
      if (!isLive) {
        queryClient.setQueryData(['activeStream'], null);
      }
      return { previousStreams };
    },
    onSuccess: () => {
      toast.success('Stream live status updated!');
    },
    onError: (err, variables, context: any) => {
      if (context?.previousStreams) {
        queryClient.setQueryData(['streams'], context.previousStreams);
      }
      toast.error('Failed to update live status.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      queryClient.invalidateQueries({ queryKey: ['activeStream'] });
    }
  });

  const deleteStreamMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/streams/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      queryClient.invalidateQueries({ queryKey: ['activeStream'] });
      toast.success('Stream deleted!');
    },
    onError: () => toast.error('Failed to delete stream.')
  });

  const handleToggleStreamForm = async () => {
    if (showStreamForm || editingStreamId) {
      const isDirty = JSON.stringify(streamFormData) !== JSON.stringify(initialStreamFormData);
      if (isDirty) {
        if (!await confirm("You have unsaved changes. Are you sure you want to close this form? All filled data will be lost.", { confirmText: 'Close Form' })) {
          return;
        }
      }
      setEditingStreamId(null);
      setStreamFormData(defaultStreamData);
      setInitialStreamFormData(defaultStreamData);
      setShowStreamForm(false);
      setStreamFormErrors({});
    } else {
      setShowStreamForm(true);
    }
  };

  const handleToggleUserForm = async () => {
    if (showUserForm) {
      const isDirty = JSON.stringify(userFormData) !== JSON.stringify(initialUserFormData);
      if (isDirty) {
        if (!await confirm("You have unsaved changes. Are you sure you want to close this form? All filled data will be lost.", { confirmText: 'Close Form' })) {
          return;
        }
      }
      setEditingUserId(null);
      setUserFormData(defaultUserData);
      setInitialUserFormData(defaultUserData);
      setSelectedUserParentMohalla('');
      setShowUserForm(false);
      setUserFormErrors({});
    } else {
      setShowUserForm(true);
    }
  };

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

  const handleStreamSubmit = (e: React.FormEvent | React.MouseEvent, isLive: boolean = true) => {
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
      toast.error('Please fill in all required fields', { icon: <AlertCircle className="w-5 h-5 text-brand-accent" /> });
      return;
    }

    if (editingStreamId) {
      const diff: any = {};
      Object.keys(streamFormData).forEach((key) => {
        if (JSON.stringify((streamFormData as any)[key]) !== JSON.stringify((initialStreamFormData as any)[key])) {
          diff[key] = (streamFormData as any)[key];
        }
      });

      if (Object.keys(diff).length === 0) {
        toast('No changes were made.');
        setEditingStreamId(null);
        setStreamFormData(defaultStreamData);
        setShowStreamForm(false);
        return;
      }

      updateStreamMutation.mutate({ id: editingStreamId, data: diff });
    } else {
      createStreamMutation.mutate({ ...streamFormData, isLive });
    }
  };

  const handleEditStream = (stream: any) => {
    const newData = {
      title: stream.title,
      speaker: stream.speaker,
      description: stream.description,
      servers: stream.servers?.length ? stream.servers : [{ name: 'Server A', url: stream.streamUrl || '' }],
      streamType: stream.streamType,
      thumbnail: stream.thumbnail || '',
      allowedParentMohallas: stream.allowedParentMohallas || ['All'],
      allowedChildMohallas: stream.allowedChildMohallas || ['All'],
      allowedGender: stream.allowedGender || 'All',
      visibility: stream.visibility || 'ADMIN'
    };
    setStreamFormData(newData);
    setInitialStreamFormData(newData);
    setEditingStreamId(stream._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- USER STATE & MUTATIONS ---
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const defaultUserData = { itsId: '', fullName: '', email: '', mobile: '', password: '', role: 'USER', mohalla: 'Burhani', gender: 'Male' };
  const [userFormData, setUserFormData] = useState(defaultUserData);
  const [initialUserFormData, setInitialUserFormData] = useState(defaultUserData);
  const [userFormErrors, setUserFormErrors] = useState<{ itsId?: boolean, fullName?: boolean, email?: boolean, mobile?: boolean }>({});
  const [selectedUserParentMohalla, setSelectedUserParentMohalla] = useState('');

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

  const [showMohallaManager, setShowMohallaManager] = useState(false);
  const [newMohallaName, setNewMohallaName] = useState('');
  const [newMohallaParent, setNewMohallaParent] = useState('');
  const [editingMohallaId, setEditingMohallaId] = useState<string | null>(null);

  const { data: mohallas, isLoading: isLoadingMohallas } = useQuery({
    queryKey: ['mohallas'],
    queryFn: () => apiClient('/mohallas'),
  });

  const getMohallaString = (userMohalla: string) => {
    if (!mohallas) return userMohalla;
    const m = mohallas.find((m: any) => m.name === userMohalla);
    if (!m) return userMohalla;
    return m.parentMohalla ? `${m.name}(${m.parentMohalla})` : m.name;
  };

  const createMohallaMutation = useMutation({
    mutationFn: (data: { name: string; parentMohalla: string }) => apiClient('/mohallas', {
      method: 'POST', body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mohallas'] });
      toast.success('Mohalla added successfully!');
      setNewMohallaName('');
      setNewMohallaParent('');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add Mohalla')
  });

  const updateMohallaMutation = useMutation({
    mutationFn: (data: { id: string; name: string; parentMohalla: string }) => {
      const mohallasList: any = queryClient.getQueryData(['mohallas']);
      const original = mohallasList?.find((m: any) => m._id === data.id);
      const diff: any = {};
      if (original) {
        if (original.name !== data.name) diff.name = data.name;
        if ((original.parentMohalla || 'Central') !== data.parentMohalla) diff.parentMohalla = data.parentMohalla;
      } else {
        diff.name = data.name; diff.parentMohalla = data.parentMohalla;
      }

      if (Object.keys(diff).length === 0) {
        return Promise.resolve({ noop: true });
      }

      return apiClient(`/mohallas/${data.id}`, {
        method: 'PUT', body: JSON.stringify(diff),
      });
    },
    onSuccess: (res: any) => {
      if (res?.noop) {
        toast('No changes were made.');
      } else {
        queryClient.invalidateQueries({ queryKey: ['mohallas'] });
        toast.success('Mohalla updated successfully!');
      }
      setNewMohallaName('');
      setNewMohallaParent('');
      setEditingMohallaId(null);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update Mohalla')
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
      setUserFormData(defaultUserData);
      setShowUserForm(false);
      toast.success('User created successfully!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create user.')
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
      setEditingUserId(null);
      toast.success('User deleted!');
    },
    onError: () => toast.error('Failed to delete user.')
  });

  const toggleRelayAccessMutation = useMutation({
    mutationFn: ({ id, hasRelayAccess }: { id: string, hasRelayAccess: boolean }) => apiClient(`/users/${id}`, {
      method: 'PUT', body: JSON.stringify({ hasRelayAccess })
    }),
    onMutate: async ({ id, hasRelayAccess }) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const previousUsers = queryClient.getQueryData(['users']);
      queryClient.setQueryData(['users'], (old: any) =>
        old?.map((u: any) => u._id === id ? { ...u, hasRelayAccess } : u)
      );
      return { previousUsers };
    },
    onSuccess: (_, { hasRelayAccess }) => {
      toast.success(hasRelayAccess ? 'Relay access granted' : 'Relay access revoked');
    },
    onError: (err, newTodo, context: any) => {
      if (context?.previousUsers) queryClient.setQueryData(['users'], context.previousUsers);
      toast.error('Failed to update relay access');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
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
    mutationFn: ({ id, data }: { id: string, data: any }) => apiClient(`/users/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserFormData(defaultUserData);
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
    } else if (e.target.name === 'mobile') {
      value = value.replace(/\D/g, '');
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
        toast.error('Please fill in all required fields', { icon: <AlertCircle className="w-5 h-5 text-brand-accent" /> });
      }
      return;
    }
    const submitData = { ...userFormData };
    if (!editingUserId && !submitData.password.trim()) {
      submitData.password = '1234';
    }

    if (editingUserId) {
      const diff: any = {};
      Object.keys(submitData).forEach((key) => {
        if (JSON.stringify((submitData as any)[key]) !== JSON.stringify((initialUserFormData as any)[key])) {
          diff[key] = (submitData as any)[key];
        }
      });
      if (!diff.password) delete diff.password;

      if (Object.keys(diff).length === 0) {
        toast('No changes were made.');
        setEditingUserId(null);
        setUserFormData(defaultUserData);
        setShowUserForm(false);
        return;
      }
      updateUserMutation.mutate({ id: editingUserId, data: diff });
    } else {
      createUserMutation.mutate(submitData);
    }
  };

  const handleEditUser = (user: any) => {
    const newData = {
      itsId: user.itsId,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      password: '', // Leave empty to not change
      role: user.role,
      mohalla: user.mohalla || 'Burhani',
      gender: user.gender || 'Male'
    };
    setUserFormData(newData);
    setInitialUserFormData(newData);
    setEditingUserId(user._id);

    const userMohallaObj = mohallas?.find((m: any) => m.name === (user.mohalla || 'Burhani'));
    setSelectedUserParentMohalla(userMohallaObj?.parentMohalla || (userMohallaObj ? userMohallaObj.name : 'Burhani'));

    setShowUserForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const processedUsers = React.useMemo(() => {
    if (!users) return [];
    let result = [...users];

    // Search by ITS ID
    if (searchItsId.trim()) {
      result = result.filter((u: any) => u.itsId?.toString().includes(searchItsId.trim()));
    }

    // Sort by Mohallah, and keep Admins on top
    result.sort((a: any, b: any) => {
      // 1. Admins on top
      if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
      if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;

      // 2. Sort by Mohallah alphabetically
      const mohallaA = a.mohalla || 'Burhani';
      const mohallaB = b.mohalla || 'Burhani';
      return mohallaA.localeCompare(mohallaB);
    });

    return result;
  }, [users, searchItsId]);

  const totalMembers = processedUsers.length;
  const sessionsInUse = processedUsers.filter((u: any) => u.sessionStatus === 'inUse').length;


  return (
    <>
      <div className="mb-8 w-full">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-brand-accent tracking-wide">Admin Dashboard</h3>
        </div>
        <div className="h-0.5 w-full bg-slate-200 mt-2"></div>
      </div>
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
            <button onClick={() => setActiveTab('announcements')} className={`shrink-0 flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'announcements' ? 'bg-sky-100 text-brand-accent shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Megaphone className="w-4 h-4 mr-2" /> Announcements
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
              <LifeBuoy className="w-4 h-4 mr-2.5" /> Support Queries
            </button>
            <button onClick={() => setActiveTab('login-issues')} className={`w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'login-issues' ? 'bg-sky-50 text-brand-accent border border-sky-100 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
              <AlertCircle className="w-4 h-4 mr-2.5" /> Login Issues
            </button>
            <button onClick={() => setActiveTab('announcements')} className={`w-full flex items-center px-2 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'announcements' ? 'bg-sky-50 text-brand-accent border border-sky-100 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
              <Megaphone className="w-4 h-4 mr-2.5" /> Announcement Responses
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-8 w-full max-w-[100vw] overflow-x-hidden">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-4xl pb-10">

            {/* STREAMS TAB */}
            {activeTab === 'stream' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div className="flex justify-between items-start w-full md:w-auto">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight mb-2 text-brand-accent">Live Stream Controls</h2>
                      <p className="text-slate-500 text-sm">Create new relays and manage the active video feed.</p>
                    </div>
                    <button
                      onClick={() => refetchStreams()}
                      className="md:hidden btn-secondary flex items-center shadow-sm overflow-hidden min-h-[38px] px-3 border-slate-300 bg-white hover:bg-slate-50 shrink-0 ml-4"
                      title="Refresh Streams"
                    >
                      <RefreshCw className={`w-4 h-4 text-slate-600 ${isFetchingStreams ? 'animate-spin text-brand-accent' : ''}`} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
                    <button
                      onClick={() => refetchStreams()}
                      className="hidden md:flex btn-secondary items-center shadow-sm overflow-hidden min-h-[38px] px-3 border-slate-300 bg-white hover:bg-slate-50"
                      title="Refresh Streams"
                    >
                      <RefreshCw className={`w-4 h-4 text-slate-600 ${isFetchingStreams ? 'animate-spin text-brand-accent' : ''}`} />
                    </button>
                    <motion.button
                      layout
                      onClick={handleToggleStreamForm}
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
                      <form onSubmit={handleStreamSubmit} className="clean-panel p-8 relative !overflow-visible">
                        {editingStreamId && (
                          <button
                            type="button"
                            onClick={handleToggleStreamForm}
                            className="absolute top-8 right-8 text-xs font-medium text-slate-500 hover:text-slate-800"
                          >
                            Cancel Edit
                          </button>
                        )}
                        <h3 className="text-lg font-medium mb-4">{editingStreamId ? 'Edit Relay' : 'Create New Relay'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Stream Title</label>
                            <input type="text" name="title" value={streamFormData.title} onChange={handleStreamChange} className={`input-field ${streamFormErrors.title ? 'border-red-500 bg-red-50 animate-gentle-shake' : ''}`} placeholder="Enter a Stream Title" />
                            {streamFormErrors.title && <p className="text-red-500 text-xs px-1">Stream Title is required</p>}
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Waaz karnar</label>
                            <input type="text" name="speaker" value={streamFormData.speaker} onChange={handleStreamChange} className={`input-field ${streamFormErrors.speaker ? 'border-red-500 bg-red-50 animate-gentle-shake' : ''}`} placeholder="Enter the name of Waaz Karnar" />
                            {streamFormErrors.speaker && <p className="text-red-500 text-xs px-1">Waaz karnar is required</p>}
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Description (Optional)</label>
                            <input type="text" name="description" value={streamFormData.description} onChange={handleStreamChange} className="input-field" placeholder="Description of the event" />
                          </div>

                          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Visibility</label>
                              <CustomDropdown
                                options={[
                                  { label: 'Admin Only', value: 'ADMIN' },
                                  { label: 'All Users', value: 'USERS' },
                                  { label: 'As Approved', value: 'AS_APPROVED' }
                                ]}
                                value={streamFormData.visibility}
                                onChange={(val) => handleStreamChange({ target: { name: 'visibility', value: val } } as any)}
                              />
                              <p className="text-xs text-slate-400 mt-1">Controls who can see this relay in their dashboard.</p>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Allowed Parent Mohallas</label>
                              <MultiSelectDropdown
                                options={[{ label: 'All', value: 'All' }, ...(mohallas?.filter((m: any) => !m.parentMohalla).map((m: any) => ({ label: m.name, value: m.name })) || [])]}
                                values={streamFormData.allowedParentMohallas}
                                onChange={(vals) => {
                                  const newVals = vals.length === 0 ? ['All'] : vals;

                                  const childOptions = mohallas?.filter((m: any) =>
                                    newVals.includes('All') ||
                                    newVals.includes(m.parentMohalla) ||
                                    newVals.includes(m.name)
                                  ).map((m: any) => ({ label: m.name, value: m.name })) || [];

                                  let newChildVals = streamFormData.allowedChildMohallas;
                                  if (newVals.includes('All')) {
                                    newChildVals = ['All'];
                                  } else if (childOptions.length === 1) {
                                    newChildVals = [childOptions[0].value];
                                  }

                                  setStreamFormData({ ...streamFormData, allowedParentMohallas: newVals, allowedChildMohallas: newChildVals });
                                }}
                              />
                              <p className="text-xs text-slate-400 mt-1">Grants access to everyone under this parent.</p>
                            </div>
                            <div>
                              <label className={`block text-xs font-semibold mb-2 uppercase tracking-wide ${streamFormData.allowedParentMohallas.includes('All') ? 'text-slate-400' : 'text-slate-500'}`}>Allowed Child Mohallas</label>
                              <MultiSelectDropdown
                                disabled={streamFormData.allowedParentMohallas.includes('All')}
                                options={(() => {
                                  const childOptions = mohallas?.filter((m: any) =>
                                    streamFormData.allowedParentMohallas.includes('All') ||
                                    streamFormData.allowedParentMohallas.includes(m.parentMohalla) ||
                                    streamFormData.allowedParentMohallas.includes(m.name)
                                  ).map((m: any) => ({ label: m.name, value: m.name })) || [];

                                  return childOptions.length > 1
                                    ? [{ label: 'All', value: 'All' }, ...childOptions]
                                    : childOptions;
                                })()}
                                values={streamFormData.allowedChildMohallas}
                                onChange={(vals) => {
                                  const newVals = vals.length === 0 ? ['All'] : vals;
                                  setStreamFormData({ ...streamFormData, allowedChildMohallas: newVals });
                                }}
                              />
                              <p className={`text-xs mt-1 ${streamFormData.allowedParentMohallas.includes('All') ? 'text-slate-300' : 'text-slate-400'}`}>Grants access only to specific Mohallahs (including Mains).</p>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Allowed Gender</label>
                              <CustomDropdown
                                options={[
                                  { label: 'All', value: 'All' },
                                  { label: 'Male Only', value: 'Male' },
                                  { label: 'Female Only', value: 'Female' }
                                ]}
                                value={streamFormData.allowedGender}
                                onChange={(val) => handleStreamChange({ target: { name: 'allowedGender', value: val } } as any)}
                              />
                              <p className="text-xs text-slate-400 mt-1">Restricts access to a specific gender.</p>
                            </div>
                          </div>

                          <div className="md:col-span-3">
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
                                        setStreamFormData({ ...streamFormData, streamType: 'HLS' });
                                        setShowStreamTypeDropdown(false);
                                      }}
                                      className={`p-4 cursor-pointer transition-colors border-b border-slate-100 flex items-start ${streamFormData.streamType === 'HLS' ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                                    >
                                      <Server className={`w-5 h-5 mt-0.5 mr-3 ${streamFormData.streamType === 'HLS' ? 'text-sky-500' : 'text-slate-400'}`} />
                                      <div>
                                        <div className={`font-semibold ${streamFormData.streamType === 'HLS' ? 'text-slate-900' : 'text-slate-700'}`}>Secure Proxy (HLS / RTMP)</div>
                                        <div className="text-xs text-slate-500 mt-1">Premium custom player. Hides origin URLs from users using tokens.</div>
                                      </div>
                                    </div>
                                    <div
                                      onClick={() => {
                                        setStreamFormData({ ...streamFormData, streamType: 'YOUTUBE' });
                                        setShowStreamTypeDropdown(false);
                                      }}
                                      className={`p-4 cursor-pointer transition-colors flex items-start ${streamFormData.streamType === 'YOUTUBE' ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                                    >
                                      <LinkIcon className={`w-5 h-5 mt-0.5 mr-3 ${streamFormData.streamType === 'YOUTUBE' ? 'text-red-500' : 'text-slate-400'}`} />
                                      <div>
                                        <div className={`font-semibold ${streamFormData.streamType === 'YOUTUBE' ? 'text-slate-900' : 'text-slate-700'}`}>YouTube / External Link</div>
                                        <div className="text-xs text-slate-500 mt-1">Standard embedded player. Best for public youtube links or Google Drive.</div>
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

                          <div className="md:col-span-2 flex items-center justify-start gap-3 pt-6 border-t border-slate-200 mt-2">
                            <button
                              type="button"
                              onClick={(e) => handleStreamSubmit(e, true)}
                              disabled={createStreamMutation.isPending || updateStreamMutation.isPending}
                              className="btn-primary"
                            >
                              {editingStreamId
                                ? (updateStreamMutation.isPending ? 'Saving...' : 'Save Changes')
                                : (createStreamMutation.isPending ? 'Creating...' : 'Create & Go Live')
                              }
                            </button>
                            {!editingStreamId && (
                              <button
                                type="button"
                                onClick={(e) => handleStreamSubmit(e, false)}
                                disabled={createStreamMutation.isPending}
                                className="btn-secondary"
                              >
                                {createStreamMutation.isPending ? 'Creating...' : 'Create Only'}
                              </button>
                            )}
                          </div>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="clean-panel mt-8 flex flex-col max-h-[70vh]">
                  <div className="p-4 border-b border-slate-200 shrink-0"><h3 className="text-lg font-medium">Relay List</h3></div>
                  <div className="flex-1 overflow-y-auto overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 relative">
                      <thead className="bg-slate-200 text-xs uppercase tracking-wider text-slate-600 font-semibold sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-4 py-3">Title</th>
                          <th className="px-4 py-3">Waaz karnar</th>
                          <th className="px-4 py-3 whitespace-nowrap">Status</th>
                          <th className="px-4 py-3 whitespace-nowrap">Visibility</th>
                          <th className="px-4 py-3 min-w-[120px]">Parent Mohallahs</th>
                          <th className="px-4 py-3 min-w-[120px]">Child Mohallahs</th>
                          <th className="px-4 py-3 whitespace-nowrap">Gender Limit</th>
                          <th className="px-4 py-3 whitespace-nowrap text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {isLoadingStreams ? (
                          <tr><td colSpan={8} className="px-4 py-3 text-center">Loading streams...</td></tr>
                        ) : streams?.map((stream: any) => (
                          <tr key={stream._id} className={`hover:bg-slate-50 transition-colors ${editingStreamId === stream._id ? 'bg-sky-50' : ''}`}>
                            <td className="px-4 py-3 font-medium text-slate-900">{stream.title}</td>
                            <td className="px-4 py-3">{stream.speaker}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {stream.isLive ? (
                                <span className="text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md text-xs font-semibold animate-pulse flex items-center w-max"><span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-2"></span> LIVE</span>
                              ) : (
                                <span className="text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-semibold">Offline</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {stream.visibility === 'USERS' ? (
                                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-xs font-semibold">All Users</span>
                              ) : stream.visibility === 'AS_APPROVED' ? (
                                <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md text-xs font-semibold">As Approved</span>
                              ) : (
                                <span className="text-brand-accent bg-brand-accent/10 border border-brand-accent/20 px-2.5 py-1 rounded-md text-xs font-semibold">Admin Only</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-slate-600 font-medium">{stream.allowedParentMohallas?.length && !stream.allowedParentMohallas.includes('All') ? stream.allowedParentMohallas.join(', ') : 'All'}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-slate-600 font-medium">{stream.allowedChildMohallas?.length && !stream.allowedChildMohallas.includes('All') ? stream.allowedChildMohallas.join(', ') : 'All'}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm text-slate-600 font-medium">{stream.allowedGender || 'All'}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end space-x-3">
                                {stream.isLive ? (
                                  <button onClick={async () => {
                                    if (await confirm(`Are you sure you want to take "${stream.title}" offline?`, { confirmText: 'Go Offline' })) {
                                      toggleLiveMutation.mutate({ id: stream._id, isLive: false });
                                    }
                                  }} className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded shadow-sm hover:bg-slate-200 hover:text-slate-900 transition-colors">Go Offline</button>
                                ) : (
                                  <button onClick={async () => {
                                    if (await confirm(`Are you sure you want to make "${stream.title}" live?`, { confirmText: 'Go Live' })) {
                                      toggleLiveMutation.mutate({ id: stream._id, isLive: true });
                                    }
                                  }} className="inline-flex items-center px-3 py-1.5 bg-brand-accent text-white text-xs font-semibold rounded shadow-sm hover:bg-brand-accent-hover transition-colors">Go Live</button>
                                )}
                                <button onClick={() => handleEditStream(stream)} className="text-brand-accent hover:text-brand-accent-hover transition-colors inline-flex align-middle" title="Edit Relay">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={async () => {
                                  if (await confirm('Are you sure you want to delete this relay?', { type: 'danger', confirmText: 'Delete Relay' })) {
                                    deleteStreamMutation.mutate(stream._id);
                                  }
                                }} className="text-red-500 hover:text-red-700 transition-colors inline-flex align-middle" title="Delete Relay">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {!isLoadingStreams && streams?.length === 0 && (
                          <tr><td colSpan={7} className="px-4 py-6 whitespace-nowrap text-center text-slate-500">No relay history found. Create a stream to get started.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div className="flex justify-between items-start w-full md:w-auto">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight mb-2 text-brand-accent">Member Directory</h2>
                      <p className="text-slate-500 text-sm">Manage access and view member activity.</p>
                    </div>
                    <button
                      onClick={() => refetchUsers()}
                      className="md:hidden btn-secondary flex items-center shadow-sm overflow-hidden min-h-[38px] px-3 border-slate-300 bg-white hover:bg-slate-50 shrink-0 ml-4"
                      title="Refresh Members"
                    >
                      <RefreshCw className={`w-4 h-4 text-slate-600 ${isFetchingUsers ? 'animate-spin text-brand-accent' : ''}`} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
                    <button
                      onClick={() => setShowMohallaManager(!showMohallaManager)}
                      className={`btn-secondary flex items-center shadow-sm overflow-hidden min-h-[38px] px-4 transition-colors ${showMohallaManager ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-300 hover:bg-slate-50'}`}
                    >
                      <Plus className={`w-4 h-4 mr-2 transition-transform ${showMohallaManager ? 'rotate-45' : ''}`} />
                      Manage Mohallas
                    </button>
                    <button
                      onClick={() => refetchUsers()}
                      className="hidden md:flex btn-secondary items-center shadow-sm overflow-hidden min-h-[38px] px-3 border-slate-300 bg-white hover:bg-slate-50"
                      title="Refresh Members"
                    >
                      <RefreshCw className={`w-4 h-4 text-slate-600 ${isFetchingUsers ? 'animate-spin text-brand-accent' : ''}`} />
                    </button>
                    <motion.button
                      layout
                      onClick={handleToggleUserForm}
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
                      <div className="clean-panel p-6 border-brand-accent/20 mb-6 bg-slate-50/50">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-medium text-brand-dark">Manage Mohallas</h3>
                          <button onClick={() => setShowMohallaManager(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
                          <div className="w-full sm:w-48 shrink-0">
                            <CustomDropdown
                              options={[{ label: 'None (Is Main)', value: '' }, ...(mohallas?.filter((m: any) => m._id !== editingMohallaId).map((m: any) => ({ label: m.name, value: m.name })) || [])]}
                              value={newMohallaParent}
                              onChange={setNewMohallaParent}
                              placeholder="Parent Mohallah"
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Mohalla Name"
                            className="input-field w-full sm:flex-1 sm:max-w-xs shrink-0"
                            value={newMohallaName}
                            onChange={(e) => setNewMohallaName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newMohallaName.trim() && !createMohallaMutation.isPending && !updateMohallaMutation.isPending) {
                                if (editingMohallaId) {
                                  updateMohallaMutation.mutate({ id: editingMohallaId, name: newMohallaName, parentMohalla: newMohallaParent });
                                } else {
                                  createMohallaMutation.mutate({ name: newMohallaName, parentMohalla: newMohallaParent });
                                }
                              }
                            }}
                          />
                          <div className="flex items-center justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
                            <button
                              onClick={() => {
                                if (newMohallaName.trim()) {
                                  if (editingMohallaId) {
                                    updateMohallaMutation.mutate({ id: editingMohallaId, name: newMohallaName, parentMohalla: newMohallaParent });
                                  } else {
                                    createMohallaMutation.mutate({ name: newMohallaName, parentMohalla: newMohallaParent });
                                  }
                                }
                              }}
                              disabled={createMohallaMutation.isPending || updateMohallaMutation.isPending || !newMohallaName.trim()}
                              className="btn-primary whitespace-nowrap"
                            >
                              {editingMohallaId ? (updateMohallaMutation.isPending ? 'Updating...' : 'Update') : (createMohallaMutation.isPending ? 'Adding...' : 'Add')}
                            </button>
                            {editingMohallaId && (
                              <button
                                onClick={() => {
                                  setEditingMohallaId(null);
                                  setNewMohallaName('');
                                  setNewMohallaParent('');
                                }}
                                className="text-slate-500 hover:text-slate-700 text-sm font-medium px-3 py-2 text-center whitespace-nowrap"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg border border-slate-200 flex flex-col max-h-[50vh]">
                          <div className="flex-1 overflow-y-auto overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600 relative">
                              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold sticky top-0 z-10 shadow-sm">
                                <tr>
                                  <th className="px-4 py-3">Parent Mohallah</th>
                                  <th className="px-4 py-3">Mohalla Name</th>
                                  <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {isLoadingMohallas ? (
                                  <tr><td colSpan={3} className="px-4 py-3 text-center text-slate-500">Loading...</td></tr>
                                ) : mohallas?.length === 0 ? (
                                  <tr><td colSpan={3} className="px-4 py-3 text-center text-slate-500">No mohallas found.</td></tr>
                                ) : mohallas?.map((m: any) => (
                                  <tr key={m._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-500">{m.parentMohalla || '-'}</td>
                                    <td className="px-4 py-3 text-slate-800">{m.name} {m.parentMohalla ? '' : <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded ml-2">Main</span>}</td>
                                    <td className="px-4 py-3">
                                      <div className="flex justify-end items-center gap-3">
                                        <button
                                          onClick={() => {
                                            setEditingMohallaId(m._id);
                                            setNewMohallaName(m.name);
                                            setNewMohallaParent(m.parentMohalla || '');
                                          }}
                                          className="text-brand-accent hover:text-brand-accent-hover p-1 transition-colors"
                                          title="Edit Mohallah"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={async () => {
                                            if (await confirm(`Delete ${m.name}? This might break existing users assigned to it.`, { type: 'danger', confirmText: 'Delete' })) {
                                              deleteMohallaMutation.mutate(m._id);
                                            }
                                          }}
                                          className="text-red-500 hover:text-red-700 p-1 transition-colors"
                                          title="Delete Mohallah"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
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
                            <input type="number" inputMode="numeric" name="itsId" value={userFormData.itsId} onChange={handleUserChange} onBlur={(e) => {
                              if (!/^\d{8}$/.test(e.target.value.trim())) {
                                setUserFormErrors((prev) => ({ ...prev, itsId: true }));
                              }
                            }} placeholder="8-digit ITS Number" className={`input-field [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${userFormErrors.itsId ? 'border-red-500 bg-red-50 animate-gentle-shake' : ''}`} />
                            {userFormErrors.itsId && <p className="text-red-500 text-xs px-1">ITS ID must be exact 8 digits</p>}
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
                            <CustomDropdown
                              options={[
                                { label: 'User', value: 'USER' },
                                { label: 'Admin', value: 'ADMIN' }
                              ]}
                              value={userFormData.role}
                              onChange={(val) => handleUserChange({ target: { name: 'role', value: val } } as any)}
                            />
                          </div>
                          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Parent Mohallah</label>
                              <CustomDropdown
                                options={mohallas?.filter((m: any) => !m.parentMohalla).map((m: any) => ({ label: m.name, value: m.name })) || []}
                                value={selectedUserParentMohalla || 'Burhani'}
                                onChange={(val) => {
                                  setSelectedUserParentMohalla(val);
                                  handleUserChange({ target: { name: 'mohalla', value: val } } as any);
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Child Mohallah</label>
                              <CustomDropdown
                                options={(() => {
                                  const parent = selectedUserParentMohalla || 'Burhani';
                                  const childOptions = mohallas?.filter((m: any) => m.parentMohalla === parent || m.name === parent).map((m: any) => ({ label: m.name, value: m.name })) || [];
                                  return childOptions;
                                })()}
                                value={userFormData.mohalla}
                                onChange={(val) => handleUserChange({ target: { name: 'mohalla', value: val } } as any)}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Gender</label>
                            <CustomDropdown
                              options={[
                                { label: 'Male', value: 'Male' },
                                { label: 'Female', value: 'Female' }
                              ]}
                              value={userFormData.gender}
                              onChange={(val) => handleUserChange({ target: { name: 'gender', value: val } } as any)}
                            />
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

                <div className="mb-4 flex items-center justify-end">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      inputMode="numeric"
                      value={searchItsId}
                      onChange={(e) => setSearchItsId(e.target.value)}
                      placeholder="Search by ITS ID..."
                      className="input-field pl-9 py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <div className="clean-panel flex flex-col max-h-[75vh]">
                  <div className="flex-1 overflow-y-auto overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 relative">
                      <thead className="bg-slate-200 text-xs uppercase tracking-wider text-slate-600 font-semibold sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-4 py-4 whitespace-nowrap">ITS ID</th>
                          <th className="px-4 py-4 whitespace-nowrap">Member</th>
                          <th className="px-4 py-4 whitespace-nowrap">Mohallah</th>
                          <th className="px-4 py-4 whitespace-nowrap">Gender</th>
                          <th className="px-4 py-4 whitespace-nowrap">Email</th>
                          <th className="px-4 py-4 whitespace-nowrap">Mobile NO.</th>
                          <th className="px-4 py-4 whitespace-nowrap">Session Status</th>
                          <th className="px-4 py-4 whitespace-nowrap">Relay Access</th>
                          <th className="px-4 py-4 whitespace-nowrap">IP & Device</th>
                          <th className="px-4 py-4 whitespace-nowrap">Logged In</th>
                          <th className="px-4 py-4 text-right whitespace-nowrap border-l border-slate-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {isLoadingUsers ? (
                          <tr><td colSpan={8} className="px-6 py-4 text-center">Loading members...</td></tr>
                        ) : processedUsers.length === 0 ? (
                          <tr><td colSpan={8} className="px-6 py-4 text-center text-slate-500">No members found.</td></tr>
                        ) : processedUsers.map((user: any) => (
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
                              <span className="text-sm font-medium text-slate-700">
                                {getMohallaString(user.mohalla || 'Burhani')}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-slate-700">
                              {user.gender || 'Male'}
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
                            <td className="px-4 py-4">
                              <button onClick={() => toggleRelayAccessMutation.mutate({ id: user._id, hasRelayAccess: !user.hasRelayAccess })} className="text-slate-500 hover:text-slate-800 transition-colors inline-flex align-middle" title={user.hasRelayAccess ? 'Revoke Relay Access' : 'Grant Relay Access'}>
                                {user.hasRelayAccess ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                              </button>
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
                              <button onClick={async () => {
                                if (user.isActive) {
                                  if (await confirm(`Do you want to deactivate user ${user.fullName}?`, { confirmText: 'Deactivate' })) {
                                    toggleUserStatusMutation.mutate({ id: user._id, isActive: false });
                                  }
                                } else {
                                  toggleUserStatusMutation.mutate({ id: user._id, isActive: true });
                                }
                              }} className="text-slate-500 hover:text-slate-800 transition-colors inline-flex align-middle" title={user.isActive ? 'Disable User' : 'Enable User'}>
                                {user.isActive ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                              </button>
                              <button onClick={() => handleEditUser(user)} className="text-brand-accent hover:text-brand-accent-hover transition-colors inline-flex align-middle" title="Edit User">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={async () => {
                                if (await confirm(`Are you sure you want to delete ${user.fullName}?`, { type: 'danger', confirmText: 'Delete User' })) {
                                  deleteUserMutation.mutate(user._id);
                                }
                              }} className="text-red-500 hover:text-red-700 transition-colors inline-flex align-middle" title="Delete User">
                                <Trash2 className="w-4 h-4" />
                              </button>
                              {user.sessionStatus === 'inUse' && (
                                <button onClick={async () => {
                                  if (await confirm(`Forcefully log out ${user.fullName}? They will be immediately disconnected.`, { type: 'danger', confirmText: 'Force Logout' })) {
                                    forceLogoutUserMutation.mutate(user._id);
                                  }
                                }} className="text-orange-500 hover:text-orange-700 transition-colors inline-flex align-middle ml-3 border-l border-slate-200 pl-3" title="Force Logout">
                                  <LogOut className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between items-center text-sm shrink-0">
                    <div className="text-slate-600 font-medium">Total Members: <span className="text-slate-900 font-bold ml-1">{totalMembers}</span></div>
                    <div className="text-blue-600 font-medium">Sessions In Use: <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full ml-1">{sessionsInUse}</span></div>
                  </div>
                </div>
              </div>
            )}
            {/* SUPPORT QUERIES TAB */}
            {activeTab === 'queries' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div className="flex justify-between items-start w-full md:w-auto">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight mb-2 text-brand-accent">Support Queries</h2>
                      <p className="text-slate-500 text-sm">Review and resolve messages from members.</p>
                    </div>
                    <button
                      onClick={() => refetchQueries()}
                      className="md:hidden btn-secondary flex items-center shadow-sm overflow-hidden min-h-[38px] px-3 border-slate-300 bg-white hover:bg-slate-50 shrink-0 ml-4"
                      title="Refresh Queries"
                    >
                      <RefreshCw className={`w-4 h-4 text-slate-600 ${isFetchingQueries ? 'animate-spin text-brand-accent' : ''}`} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
                    <button
                      onClick={() => refetchQueries()}
                      className="hidden md:flex btn-secondary items-center shadow-sm overflow-hidden min-h-[38px] px-3 border-slate-300 bg-white hover:bg-slate-50"
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
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (await confirm('Delete this support query?', { type: 'danger', confirmText: 'Delete' })) {
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
                                <span className="text-sm font-medium text-slate-800">{getMohallaString(selectedQuery.mohalla)}</span>
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
                        <motion.div key="table" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="w-full flex flex-col max-h-[70vh] border border-slate-200 rounded-lg overflow-hidden">
                          <div className="flex-1 overflow-y-auto overflow-x-auto">
                            <table className="w-full text-left border-collapse relative">
                              <thead className="sticky top-0 z-10 shadow-sm">
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
                                      {getMohallaString(q.mohalla)}
                                    </td>
                                    <td className="py-4 px-6 text-sm text-slate-600 max-w-xs truncate" title={q.query}>
                                      {q.query}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (await confirm('Delete this support query?', { type: 'danger', confirmText: 'Delete' })) {
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div className="flex justify-between items-start w-full md:w-auto">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight mb-2 text-brand-accent">Login Issues</h2>
                      <p className="text-slate-500 text-sm">Review members stuck at the log in screen.</p>
                    </div>
                    <button
                      onClick={() => refetchLoginIssues()}
                      className="md:hidden btn-secondary flex items-center shadow-sm overflow-hidden min-h-[38px] px-3 border-slate-300 bg-white hover:bg-slate-50 shrink-0 ml-4"
                      title="Refresh Login Issues"
                    >
                      <RefreshCw className={`w-4 h-4 text-slate-600 ${isFetchingLoginIssues ? 'animate-spin text-brand-accent' : ''}`} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
                    <button
                      onClick={() => refetchLoginIssues()}
                      className="hidden md:flex btn-secondary items-center shadow-sm overflow-hidden min-h-[38px] px-3 border-slate-300 bg-white hover:bg-slate-50"
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
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (await confirm('Delete this login issue?', { type: 'danger', confirmText: 'Delete' })) {
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
                        <motion.div key="table" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="w-full flex flex-col max-h-[70vh] border border-slate-200 rounded-lg overflow-hidden">
                          <div className="flex-1 overflow-y-auto overflow-x-auto">
                            <table className="w-full text-left border-collapse relative">
                              <thead className="sticky top-0 z-10 shadow-sm">
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
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (await confirm('Delete this login issue?', { type: 'danger', confirmText: 'Delete' })) {
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

            {activeTab === 'announcements' && (
              <div className="space-y-8">
                <AdminAnnouncementsTab />
              </div>
            )}

          </motion.div>
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;

