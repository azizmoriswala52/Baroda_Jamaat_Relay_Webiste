import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Download, Edit2, Eye, Plus, Trash2, X, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../api/apiClient';
import CustomDropdown from '../components/CustomDropdown';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import { useConfirm } from '../contexts/ConfirmContext';

const ResponseTable = ({
  announcement,
  getMohallaString,
  handleDownloadCsv,
  setSelectedAnnouncement
}: {
  announcement: any;
  getMohallaString: (m: string) => string;
  handleDownloadCsv: (id: string, title: string) => void;
  setSelectedAnnouncement: (a: any) => void;
}) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);

  const { data: responses = [], isLoading: isLoadingResponses } = useQuery({
    queryKey: ['responses', announcement._id],
    queryFn: () => apiClient(`/site-announcements/${announcement._id}/responses`),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ responseId, status }: { responseId: string; status: string }) =>
      apiClient(`/site-announcements/${announcement._id}/responses/${responseId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responses', announcement._id] });
      toast.success('Status updated successfully');
    },
    onError: () => toast.error('Failed to update status')
  });

  const selectedApproval = responses.find((r: any) => r._id === selectedApprovalId);

  const headerText = announcement.responseType === 'RSVP'
    ? `RSVP Responses: ${announcement.title}`
    : announcement.responseType === 'APPROVAL'
      ? `Approval Request Responses: ${announcement.title}`
      : `Responses: ${announcement.title}`;

  const totalResponses = responses.length;
  let statsRow = null;

  if (announcement.responseType === 'APPROVAL' && !selectedApproval) {
    const approved = responses.filter((r: any) => r.status === 'APPROVED').length;
    const rejected = responses.filter((r: any) => r.status === 'REJECTED').length;
    const pending = responses.filter((r: any) => !r.status || r.status === 'PENDING').length;

    statsRow = (
      <div className="flex flex-wrap gap-x-8 gap-y-4 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Requests</span>
          <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{totalResponses}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Approved</span>
          <span className="text-xl font-bold text-emerald-700">{approved}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending</span>
          <span className="text-xl font-bold text-amber-700">{pending}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Rejected</span>
          <span className="text-xl font-bold text-red-700">{rejected}</span>
        </div>
      </div>
    );
  } else if (announcement.responseType === 'RSVP' && !selectedApproval) {
    const rsvpCounts = responses.reduce((acc: Record<string, number>, curr: any) => {
      const resp = curr.response || 'Unknown';
      acc[resp] = (acc[resp] || 0) + 1;
      return acc;
    }, {});

    statsRow = (
      <div className="flex flex-wrap gap-x-8 gap-y-4 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 items-center">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Responses</span>
          <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{totalResponses}</span>
        </div>
        {Object.entries(rsvpCounts).map(([option, count]: [string, any]) => (
          <div key={option} className="flex flex-col">
            <span className="text-xs font-semibold text-brand-accent dark:text-blue-300 uppercase tracking-wider">{option}</span>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{count}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="clean-panel mt-8">
      <div className="bg-slate-200 dark:bg-slate-700 px-6 py-4 border-b border-slate-300 dark:border-slate-600 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {selectedApproval ? 'Approval Request Details' : headerText}
        </h3>
        <div className="flex space-x-2">
          {selectedApproval ? (
            <button
              onClick={() => setSelectedApprovalId(null)}
              className="btn-secondary text-sm font-medium flex items-center px-3 py-1.5 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:bg-slate-900/50"
            >
              &larr; Back to List
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => handleDownloadCsv(announcement._id, announcement.title)}
                className="btn-secondary text-sm font-medium flex items-center px-3 py-1.5 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:bg-slate-900/50"
              >
                <Download className="w-4 h-4 mr-1.5" /> Download CSV
              </button>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="btn-secondary text-sm font-medium flex items-center px-3 py-1.5 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:bg-slate-900/50"
              >
                <X className="w-4 h-4 mr-1" /> Close
              </button>
            </div>
          )}
        </div>
      </div>

      {isLoadingResponses ? (
        <div className="p-12 flex justify-center w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
        </div>
      ) : responses.length > 0 ? (
        <div className="relative w-full">
          {statsRow}
          <AnimatePresence mode="wait">
            {selectedApproval ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <div className="p-6 sm:p-10">
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-8">{selectedApproval.userId.fullName}</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">ITS ID</span>
                      <span className="text-sm font-medium text-brand-accent dark:text-blue-300 font-mono">{selectedApproval.userId.itsId}</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Mobile</span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{selectedApproval.userId.mobile}</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Jamaat</span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{selectedApproval.userId.jamaatName}</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Mohallah</span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{getMohallaString(selectedApproval.userId.mohalla || 'Burhani')}</span>
                    </div>
                  </div>

                  <div className="mb-8">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Request Reason / Response</span>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap border border-slate-200 dark:border-slate-700 leading-relaxed">
                      {selectedApproval.response}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={async () => {
                        if (await confirm(`Are you sure you want to approve the request for ${selectedApproval.userId.fullName}?`, { confirmText: 'Approve Request' })) {
                          updateStatusMutation.mutate({ responseId: selectedApproval._id, status: 'APPROVED' });
                        }
                      }}
                      disabled={updateStatusMutation.isPending || selectedApproval.status === 'APPROVED'}
                      className="btn-primary px-6 shadow-sm"
                    >
                      Approve Request
                    </button>
                    <button
                      onClick={async () => {
                        if (await confirm(`Are you sure you want to mark the request for ${selectedApproval.userId.fullName} as pending?`, { confirmText: 'Mark Pending' })) {
                          updateStatusMutation.mutate({ responseId: selectedApproval._id, status: 'PENDING' });
                        }
                      }}
                      disabled={updateStatusMutation.isPending || selectedApproval.status === 'PENDING'}
                      className="px-6 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      Mark Pending
                    </button>
                    <button
                      onClick={async () => {
                        if (await confirm(`Are you sure you want to reject the request for ${selectedApproval.userId.fullName}?`, { confirmText: 'Not Approve' })) {
                          updateStatusMutation.mutate({ responseId: selectedApproval._id, status: 'REJECTED' });
                        }
                      }}
                      disabled={updateStatusMutation.isPending || selectedApproval.status === 'REJECTED'}
                      className="px-6 py-2 bg-red-100 text-red-700 hover:bg-red-200 font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      Not Approve
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : announcement.responseType === 'RSVP' ? (
              <motion.div key="rsvp-table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 relative">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 whitespace-nowrap">ITS ID</th>
                      <th className="px-6 py-4 whitespace-nowrap">Name</th>
                      <th className="px-6 py-4 whitespace-nowrap">Jamaat</th>
                      <th className="px-6 py-4 whitespace-nowrap">Mohallah</th>
                      <th className="px-6 py-4 whitespace-nowrap">Mobile</th>
                      <th className="px-6 py-4 whitespace-nowrap">Response</th>
                      <th className="px-6 py-4 whitespace-nowrap">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                    {responses.map((r: any) => (
                      <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:bg-slate-900/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-800 dark:text-slate-100">{r.userId.itsId}</td>
                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100">{r.userId.fullName}</td>
                        <td className="px-6 py-4">{r.userId.jamaatName}</td>
                        <td className="px-6 py-4">{getMohallaString(r.userId.mohalla || 'Burhani')}</td>
                        <td className="px-6 py-4">{r.userId.mobile}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md text-xs font-bold shadow-sm max-w-[200px] inline-block truncate" title={r.response}>
                            {r.response}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                          {new Date(r.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            ) : (
              <motion.div key="approval-table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 relative">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 whitespace-nowrap">ITS ID</th>
                      <th className="px-6 py-4 whitespace-nowrap">Name</th>
                      <th className="px-6 py-4 whitespace-nowrap">Jamaat</th>
                      <th className="px-6 py-4 whitespace-nowrap">Mohallah</th>
                      <th className="px-6 py-4 whitespace-nowrap">Mobile</th>
                      <th className="px-6 py-4 whitespace-nowrap">Status</th>
                      <th className="px-6 py-4 whitespace-nowrap">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                    {responses.map((r: any) => (
                      <tr key={r._id} onClick={() => setSelectedApprovalId(r._id)} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:bg-slate-900/50 transition-colors cursor-pointer group">
                        <td className="px-6 py-4 font-mono text-slate-800 dark:text-slate-100 group-hover:text-brand-accent dark:text-blue-300">{r.userId.itsId}</td>
                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100">{r.userId.fullName}</td>
                        <td className="px-6 py-4">{r.userId.jamaatName}</td>
                        <td className="px-6 py-4">{getMohallaString(r.userId.mohalla || 'Burhani')}</td>
                        <td className="px-6 py-4">{r.userId.mobile}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            r.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200' :
                              'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                            {r.status || 'PENDING'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                          {new Date(r.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 w-full">
          No responses yet.
        </div>
      )}
    </div>
  );
};

const AdminAnnouncementsTab = () => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    responseType: string;
    rsvpOptions: string;
    targetParentMohallas: string[];
    targetChildMohallas: string[];
    deadline: string;
  }>({
    title: '',
    content: '',
    responseType: 'APPROVAL',
    rsvpOptions: '',
    targetParentMohallas: ['All'],
    targetChildMohallas: ['All'],
    deadline: ''
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const { data: announcements = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: () => apiClient('/site-announcements'),
  });

  const { data: mohallas } = useQuery({
    queryKey: ['mohallas'],
    queryFn: () => apiClient('/mohallas'),
  });

  const getMohallaString = (userMohalla: string) => {
    if (!mohallas) return userMohalla;
    const m = mohallas.find((m: any) => m.name === userMohalla);
    if (!m) return userMohalla;
    return m.parentMohalla ? `${m.name}(${m.parentMohalla})` : m.name;
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient('/site-announcements', {
      method: 'POST',
      body: JSON.stringify({
        ...data
      })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('Announcement created successfully');
      setShowForm(false);
      setFormData({ title: '', content: '', responseType: 'APPROVAL', rsvpOptions: '', targetParentMohallas: ['All'], targetChildMohallas: ['All'], deadline: '' });
      setErrors({});
    },
    onError: () => toast.error('Failed to create announcement')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/site-announcements/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('Announcement deleted');
      setSelectedAnnouncement(null);
    },
    onError: () => toast.error('Failed to delete announcement')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => apiClient(`/site-announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('Announcement updated successfully');
      setShowForm(false);
      setEditingAnnouncementId(null);
      setFormData({ title: '', content: '', responseType: 'APPROVAL', rsvpOptions: '', targetParentMohallas: ['All'], targetChildMohallas: ['All'], deadline: '' });
      setErrors({});
    },
    onError: () => toast.error('Failed to update announcement')
  });

  const handleEdit = (announcement: any) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      responseType: announcement.responseType,
      rsvpOptions: announcement.rsvpOptions ? announcement.rsvpOptions.join(', ') : '',
      targetParentMohallas: announcement.targetParentMohallas || ['All'],
      targetChildMohallas: announcement.targetChildMohallas || ['All'],
      deadline: announcement.deadline ? new Date(announcement.deadline).toISOString().slice(0, 16) : ''
    });
    setEditingAnnouncementId(announcement._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleForm = async () => {
    if (showForm || editingAnnouncementId) {
      if (formData.title.trim() || formData.content.trim()) {
        const isConfirmed = await confirm('You have unsaved changes. Are you sure you want to close this form?', { confirmText: 'Close Form' });
        if (!isConfirmed) return;
      }
      setShowForm(false);
      setEditingAnnouncementId(null);
      setFormData({ title: '', content: '', responseType: 'APPROVAL', rsvpOptions: '', targetParentMohallas: ['All'], targetChildMohallas: ['All'], deadline: '' });
      setErrors({});
    } else {
      setShowForm(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    if (!formData.title) newErrors.title = true;
    if (!formData.content) newErrors.content = true;
    if (formData.responseType === 'RSVP' && !formData.rsvpOptions.trim()) newErrors.rsvpOptions = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }

    const payload = {
      ...formData,
      rsvpOptions: formData.responseType === 'RSVP' ? formData.rsvpOptions.split(',').map(s => s.trim()).filter(Boolean) : [],
      deadline: formData.responseType !== 'NONE' && formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
    };

    if (editingAnnouncementId) {
      updateMutation.mutate({ id: editingAnnouncementId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDownloadCsv = async (announcementId: string, title: string) => {
    try {
      const responses = await apiClient(`/site-announcements/${announcementId}/responses`);
      if (responses.length === 0) return toast.error('No responses to download');

      const headers = ['ITS ID', 'Name', 'Mobile', 'Jamaat', 'Mohallah', 'Response', 'Date'];
      const rows = responses.map((r: any) => [
        r.userId.itsId,
        r.userId.fullName,
        `${r.userId.mobile}`,
        r.userId.jamaatName,
        getMohallaString(r.userId.mohalla || 'Burhani'),
        r.response,
        new Date(r.createdAt).toLocaleString('en-US')
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((r: any) => r.map((c: any) => `"${c}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Responses_${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`;
      link.click();
    } catch (err) {
      toast.error('Failed to download CSV');
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER MATCHING "CREATE RELAY" SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex justify-between items-start w-full md:w-auto">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight mb-2 text-brand-accent dark:text-blue-300">Announcements Management</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Create announcements and track user RSVP responses.</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="md:hidden btn-secondary flex items-center shadow-sm overflow-hidden min-h-[38px] px-3 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:bg-slate-900/50 shrink-0 ml-4 disabled:opacity-50"
            title="Refresh Announcements"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 dark:text-slate-300 ${isFetching ? 'animate-spin text-brand-accent dark:text-blue-300' : ''}`} />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="hidden md:flex btn-secondary items-center shadow-sm overflow-hidden min-h-[38px] px-3 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:bg-slate-900/50 disabled:opacity-50"
            title="Refresh Announcements"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 dark:text-slate-300 ${isFetching ? 'animate-spin text-brand-accent dark:text-blue-300' : ''}`} />
          </button>
          <motion.button
            layout
            onClick={handleToggleForm}
            className="btn-primary flex items-center shadow-sm overflow-hidden min-h-[38px] px-4"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={(showForm || editingAnnouncementId) ? 'close' : 'add'}
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                transition={{ duration: 0.15 }}
                className="flex items-center whitespace-nowrap"
              >
                {(showForm || editingAnnouncementId) ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {(showForm || editingAnnouncementId) ? 'Close Form' : 'Create Announcement'}
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* FORM MATCHING CREATE RELAY FORM BEHAVIOR */}
      <AnimatePresence>
        {(showForm || editingAnnouncementId) && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20, margin: 0, padding: 0, overflow: 'hidden' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <form onSubmit={handleSubmit} className="clean-panel p-8 relative !overflow-visible">
              {editingAnnouncementId && (
                <button
                  type="button"
                  onClick={handleToggleForm}
                  className="absolute top-8 right-8 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100"
                >
                  Cancel Edit
                </button>
              )}
              <h3 className="text-lg font-medium mb-6">{editingAnnouncementId ? 'Edit Announcement' : 'Create New Announcement'}</h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Announcement Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      if (errors.title) setErrors(prev => ({ ...prev, title: false }));
                    }}
                    className={`input-field max-w-2xl ${errors.title ? 'border-red-500 animate-gentle-shake focus:border-red-500 focus:ring-red-200' : ''}`}
                    placeholder="E.g. Jaman RSVP for upcoming Miqaat"
                  />
                  {errors.title && <p className="text-red-500 text-xs px-1 mt-1">Announcement Title is required</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Content <span className="text-red-500">*</span></label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => {
                      setFormData({ ...formData, content: e.target.value });
                      if (errors.content) setErrors(prev => ({ ...prev, content: false }));
                    }}
                    className={`input-field min-h-[160px] resize-y max-w-3xl ${errors.content ? 'border-red-500 animate-gentle-shake focus:border-red-500 focus:ring-red-200' : ''}`}
                    placeholder="Write your announcement details here..."
                  />
                  {errors.content && <p className="text-red-500 text-xs px-1 mt-1">Content is required</p>}
                </div>

                <div className="space-y-1 max-w-sm">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Record Response As</label>
                  <CustomDropdown
                    options={[
                      { label: 'None (Info Only)', value: 'NONE' },
                      { label: 'Approval Request', value: 'APPROVAL' },
                      { label: 'RSVP Confirmation', value: 'RSVP' }
                    ]}
                    value={formData.responseType}
                    onChange={(val) => setFormData({ ...formData, responseType: val })}
                  />
                </div>

                {formData.responseType !== 'NONE' && (
                  <div className="space-y-1 max-w-sm">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Response Deadline (Optional)</label>
                    <input
                      type="datetime-local"
                      min={new Date().toISOString().slice(0, 16)}
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="input-field"
                    />
                    <p className="text-xs text-slate-400 mt-1">If set, responses will not be accepted after this time.</p>
                  </div>
                )}
                <div className="space-y-4 max-w-2xl mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Allowed Parent Mohallas</label>
                      <MultiSelectDropdown
                        options={[{ label: 'All', value: 'All' }, ...(mohallas?.filter((m: any) => !m.parentMohalla).map((m: any) => ({ label: m.name, value: m.name })) || [])]}
                        values={formData.targetParentMohallas}
                        onChange={(vals) => {
                          const newVals = vals.length === 0 ? ['All'] : vals;
                          const childOptions = mohallas?.filter((m: any) =>
                            newVals.includes('All') ||
                            newVals.includes(m.parentMohalla) ||
                            newVals.includes(m.name)
                          ).map((m: any) => ({ label: m.name, value: m.name })) || [];
                          let newChildVals = formData.targetChildMohallas;
                          if (newVals.includes('All')) {
                            newChildVals = ['All'];
                          } else if (childOptions.length === 1) {
                            newChildVals = [childOptions[0].value];
                          }
                          setFormData({ ...formData, targetParentMohallas: newVals, targetChildMohallas: newChildVals });
                        }}
                      />
                      <p className="text-xs text-slate-400 mt-1">Grants access to everyone under this parent.</p>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-2 uppercase tracking-wide ${formData.targetParentMohallas.includes('All') ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>Allowed Child Mohallas</label>
                      <MultiSelectDropdown
                        disabled={formData.targetParentMohallas.includes('All')}
                        options={(() => {
                          const childOptions = mohallas?.filter((m: any) =>
                            formData.targetParentMohallas.includes('All') ||
                            formData.targetParentMohallas.includes(m.parentMohalla) ||
                            formData.targetParentMohallas.includes(m.name)
                          ).map((m: any) => ({ label: m.name, value: m.name })) || [];
                          return childOptions.length > 1 ? [{ label: 'All', value: 'All' }, ...childOptions] : childOptions;
                        })()}
                        values={formData.targetChildMohallas}
                        onChange={(vals) => {
                          const newVals = vals.length === 0 ? ['All'] : vals;
                          setFormData({ ...formData, targetChildMohallas: newVals });
                        }}
                      />
                      <p className={`text-xs mt-1 ${formData.targetParentMohallas.includes('All') ? 'text-slate-300' : 'text-slate-400'}`}>Grants access only to specific Mohallahs.</p>
                    </div>
                  </div>
                </div>

                {formData.responseType === 'RSVP' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="max-w-2xl"
                  >
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Custom RSVP Options <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.rsvpOptions}
                      onChange={(e) => {
                        setFormData({ ...formData, rsvpOptions: e.target.value });
                        if (errors.rsvpOptions) setErrors(prev => ({ ...prev, rsvpOptions: false }));
                      }}
                      className={`input-field w-full ${errors.rsvpOptions ? 'border-red-500 animate-gentle-shake focus:border-red-500 focus:ring-red-200' : ''}`}
                      placeholder="e.g. Attending, Not Attending"
                    />
                    {errors.rsvpOptions && <p className="text-red-500 text-xs px-1 mt-1">Custom RSVP Options is required</p>}
                    <p className="text-xs text-slate-400 mt-2">Enter the options separated by commas (,)</p>
                  </motion.div>
                )}

                <div className="pt-4 border-t border-slate-100">
                  <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary px-8">
                    {createMutation.isPending || updateMutation.isPending ? (editingAnnouncementId ? 'Updating...' : 'Publishing...') : (editingAnnouncementId ? 'Update Announcement' : 'Publish Announcement')}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ANNOUNCEMENT HISTORY TABLE */}
      <div className="clean-panel flex flex-col">
        <div className="bg-slate-200 dark:bg-slate-700 px-6 py-4 border-b border-slate-300 dark:border-slate-600 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Announcement History</h3>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center w-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 w-full">No announcements created yet.</div>
        ) : (
          <div className="flex-1 overflow-y-auto overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 relative">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Date</th>
                  <th className="px-6 py-4 whitespace-nowrap max-w-[200px]">Title</th>
                  <th className="px-6 py-4 whitespace-nowrap">Parent Targets</th>
                  <th className="px-6 py-4 whitespace-nowrap">Child Targets</th>
                  <th className="px-6 py-4 whitespace-nowrap">Response Type</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap border-l border-slate-200 dark:border-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {announcements.map((announcement: any) => (
                  <tr
                    key={announcement._id}
                    className={`group transition-colors ${selectedAnnouncement?._id === announcement._id ? 'bg-sky-50 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:bg-slate-900/50'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {new Date(announcement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <div className="text-slate-900 dark:text-slate-50 font-semibold truncate" title={announcement.title}>{announcement.title}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs mt-1 truncate" title={announcement.content}>{announcement.content}</div>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      {announcement.targetParentMohallas && announcement.targetParentMohallas.length > 0 && !announcement.targetParentMohallas.includes('All') ? (
                        <div className="text-sm text-slate-700 dark:text-slate-200 truncate" title={announcement.targetParentMohallas.join(', ')}>
                          {announcement.targetParentMohallas.join(', ')}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">All</span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      {announcement.targetChildMohallas && announcement.targetChildMohallas.length > 0 && !announcement.targetChildMohallas.includes('All') ? (
                        <div className="text-sm text-slate-700 dark:text-slate-200 truncate" title={announcement.targetChildMohallas.join(', ')}>
                          {announcement.targetChildMohallas.join(', ')}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">All</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {announcement.responseType === 'APPROVAL' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          APPROVAL
                        </span>
                      ) : announcement.responseType === 'RSVP' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          RSVP
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap border-l border-slate-200 dark:border-slate-700">
                      <div className="flex justify-end gap-2">
                        {announcement.responseType !== 'NONE' && (
                          <button
                            onClick={() => setSelectedAnnouncement(announcement)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${selectedAnnouncement?._id === announcement._id ? 'bg-brand-accent text-white shadow-md' : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:bg-slate-900/50 shadow-sm'}`}
                          >
                            <Eye className="w-3 h-3 mr-1.5" /> View Responses
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(announcement)}
                          className="p-1.5 text-slate-400 hover:text-brand-accent dark:text-blue-300 hover:bg-sky-50 dark:hover:bg-slate-800 dark:hover:bg-slate-800 rounded transition-colors inline-flex align-middle"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (await confirm('Are you sure you want to delete this announcement? This action cannot be undone and will permanently remove all associated user responses.', { confirmText: 'Delete Announcement' })) {
                              deleteMutation.mutate(announcement._id);
                            }
                          }}
                          className="text-slate-400 hover:text-red-600 transition-colors inline-flex align-middle p-1.5 rounded hover:bg-red-50"
                          title="Delete Announcement"
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
        )}
      </div>

      {/* RESPONSES TABLE SECTION */}
      <AnimatePresence mode="wait">
        {selectedAnnouncement && (
          <motion.div
            key={selectedAnnouncement._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <ResponseTable
              announcement={selectedAnnouncement}
              getMohallaString={getMohallaString}
              handleDownloadCsv={handleDownloadCsv}
              setSelectedAnnouncement={setSelectedAnnouncement}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAnnouncementsTab;
