import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, color } from 'framer-motion';
import { Megaphone, Calendar, CheckCircle2, ShieldAlert, RefreshCw, Clock, XCircle } from 'lucide-react';
import { apiClient } from '../api/apiClient';
import { toast } from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  responseType: 'NONE' | 'APPROVAL' | 'RSVP';
  createdAt: string;
  rsvpOptions?: string[];
  deadline?: string;
  targetParentMohallas?: string[];
  targetChildMohallas?: string[];
  userResponse?: string | null;
  userResponseStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED' | null;
  submissionCount: number;
}

const AnnouncementsPage = () => {
  useDocumentTitle('Announcements');
  const queryClient = useQueryClient();
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [selectedRsvpOption, setSelectedRsvpOption] = useState<string>('');

  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const { data: announcements = [], isLoading, refetch, isFetching } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: () => apiClient('/site-announcements'),
  });

  const submitResponseMutation = useMutation({
    mutationFn: ({ id, response }: { id: string; response: string }) =>
      apiClient(`/site-announcements/${id}/rsvp`, {
        method: 'POST',
        body: JSON.stringify({ response }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Your response has been recorded.');
      setActiveFormId(null);
      setReason('');
      setSelectedRsvpOption('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit response');
    },
  });

  const revokeRequestMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/site-announcements/${id}/revoke`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Your request has been revoked.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to revoke request');
    },
  });

  return (
    <>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-brand-accent dark:text-blue-300 tracking-wide">Announcements</h3>
          <button
            onClick={() => refetch()}
            className="p-2 transition-colors flex items-center text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-accent dark:text-blue-300 bg-transparent border-none cursor-pointer"
            title="Refresh Announcements"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin text-brand-accent dark:text-blue-300' : ''}`} />
            Refresh
          </button>
        </div>
        <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-700 mt-2"></div>
      </div>

      <div className={`space-y-6 max-w-4xl ${(!announcements || announcements.length === 0) ? 'mx-auto' : ''}`}>
        {isLoading || (isFetching && (!announcements || announcements.length === 0)) ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-accent"></div>
          </div>
        ) : !announcements || announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center text-slate-500 dark:text-slate-400 min-h-[40vh]">
            <Megaphone className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium">No announcements yet</p>
            <p className="text-sm mt-1">Check back later for updates</p>
          </div>
        ) : (
          <AnimatePresence>
            {announcements.map((announcement) => {
              const hasDeadlinePassed = announcement.deadline ? new Date() > new Date(announcement.deadline) : false;
              return (
                <motion.div
                  key={announcement._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col md:flex-row"
                >
                  {/* DATE COLUMN */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 md:w-48 p-6 md:p-8 flex flex-row md:flex-col justify-between md:justify-center items-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700 shrink-0 text-center">
                    <div className="flex flex-row md:flex-col items-baseline md:items-center space-x-2 md:space-x-0">
                      <span className="text-slate-800 dark:text-slate-100 font-bold text-3xl md:text-5xl leading-none md:mb-2">
                        {new Date(announcement.createdAt).getDate()}
                      </span>
                      <span className="text-brand-accent dark:text-blue-300 font-semibold text-sm uppercase tracking-wider">
                        {new Date(announcement.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    {announcement.responseType !== 'NONE' && (
                      <div className="md:mt-6">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${announcement.responseType === 'APPROVAL' ? 'bg-amber-100 text-amber-700' : 'bg-brand-accent/10 text-brand-accent dark:text-blue-300'
                          }`}>
                          {announcement.responseType === 'APPROVAL' ? 'Needs Approval' : 'RSVP Required'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CONTENT CARD */}
                  <div className="p-6 md:p-8 flex-1">
                    <h2 className="text-2xl font-semibold text-brand-accent dark:text-blue-300 mb-4">
                      {announcement.title}
                    </h2>

                    <div className="text-slate-600 dark:text-slate-100 leading-relaxed max-w-none">
                      {announcement.content.split('\n').map((para, i) => (
                        <p key={i} className="mb-3 last:mb-0">{para}</p>
                      ))}
                    </div>

                    {announcement.responseType !== 'NONE' && (
                      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                        {announcement.deadline && (
                          <div className="mb-4 flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                            <Clock className="w-4 h-4 mr-2 shrink-0 text-slate-400 dark:text-slate-500" />
                            <span>Responses accepted till: <span className="text-slate-700 dark:text-slate-200 dark:text-slate-300 font-semibold">{new Date(announcement.deadline).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span></span>
                          </div>
                        )}
                        {activeFormId === announcement._id ? (
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="clean-panel p-5"
                            >
                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-100 pb-3 flex items-center">
                                {announcement.responseType === 'APPROVAL' ? (
                                  <><ShieldAlert className="w-4 h-4 mr-2" style={{ color: 'var(--color-brand-accent dark:text-blue-300)' }} /> Request Approval</>
                                ) : (
                                  <><CheckCircle2 className="w-4 h-4 mr-2" style={{ color: 'var(--color-brand-accent dark:text-blue-300)' }} /> Confirm RSVP</>
                                )}
                              </h4>

                              <div className="space-y-4">
                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">ITS ID</label>
                                  <input
                                    type="text"
                                    readOnly
                                    value={user?.itsId || ''}
                                    className="input-field bg-slate-100 dark:bg-slate-800 cursor-not-allowed font-mono text-slate-600 dark:text-slate-300"
                                  />
                                </div>

                                {announcement.responseType === 'RSVP' && announcement.rsvpOptions && announcement.rsvpOptions.length > 0 && (
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Will Attend <span className="text-red-500">*</span></label>
                                    <div className="space-y-2">
                                      {announcement.rsvpOptions.map((opt: string, idx: number) => (
                                        <label key={idx} className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${selectedRsvpOption === opt ? 'border-brand-accent bg-brand-accent/5' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600'}`}>
                                          <div className="flex items-center h-5">
                                            <input
                                              type="radio"
                                              name={`rsvp-${announcement._id}`}
                                              value={opt}
                                              checked={selectedRsvpOption === opt}
                                              onChange={(e) => setSelectedRsvpOption(e.target.value)}
                                              className="w-4 h-4 text-brand-accent dark:text-blue-300 accent-brand-accent dark:text-blue-300 border-slate-300 dark:border-slate-600 focus:ring-brand-accent"
                                            />
                                          </div>
                                          <div className="ml-3 text-sm text-slate-700 dark:text-slate-200 font-medium">
                                            {opt}
                                          </div>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {announcement.responseType === 'APPROVAL' && (
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Reason for request <span className="text-red-500">*</span></label>
                                    <textarea
                                      value={reason}
                                      onChange={(e) => setReason(e.target.value)}
                                      placeholder="Enter your reason..."
                                      className="input-field min-h-[80px] resize-y"
                                      required
                                    />
                                  </div>
                                )}

                                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => setActiveFormId(null)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:text-slate-100 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => submitResponseMutation.mutate({
                                      id: announcement._id,
                                      response: announcement.responseType === 'APPROVAL' ? reason : (announcement.rsvpOptions && announcement.rsvpOptions.length > 0 ? selectedRsvpOption : 'Confirmed')
                                    })}
                                    disabled={submitResponseMutation.isPending || (announcement.responseType === 'APPROVAL' && !reason.trim()) || (announcement.responseType === 'RSVP' && announcement.rsvpOptions && announcement.rsvpOptions.length > 0 && !selectedRsvpOption)}
                                    className="btn-primary px-6 shadow-sm disabled:opacity-50"
                                  >
                                    {submitResponseMutation.isPending ? 'Submitting...' : 'Submit'}
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        ) : announcement.userResponse && announcement.userResponseStatus !== 'REVOKED' ? (
                          <div className="clean-panel p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">
                              <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Your response has been recorded.
                              </h4>
                              <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                                {announcement.responseType === 'APPROVAL' && (
                                  <span className="font-semibold text-brand-accent dark:text-blue-300">
                                    Status: {announcement.userResponseStatus === 'APPROVED' ? 'Approved' :
                                      announcement.userResponseStatus === 'REJECTED' ? 'Not approved' :
                                        'Pending'}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="space-y-4 opacity-80 pointer-events-none">
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 mb-1.5">ITS ID</label>
                                <input
                                  type="text"
                                  readOnly
                                  value={user?.itsId || ''}
                                  className="input-field bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-100"
                                />
                              </div>

                              {announcement.responseType === 'RSVP' && announcement.rsvpOptions && announcement.rsvpOptions.length > 0 && (
                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 mb-2 uppercase tracking-wide">Selected RSVP Option</label>
                                  <div className="space-y-2">
                                    {announcement.rsvpOptions.map((opt: string, idx: number) => (
                                      <label key={idx} className={`flex items-start p-3 border rounded-lg ${announcement.userResponse === opt ? 'border-brand-accent bg-brand-accent/5' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                                        <div className="flex items-center h-5">
                                          <input
                                            type="radio"
                                            readOnly
                                            checked={announcement.userResponse === opt}
                                            className="w-4 h-4 text-brand-accent dark:text-blue-300 accent-brand-accent dark:text-blue-300 border-slate-300 dark:border-slate-600 focus:ring-brand-accent"
                                          />
                                        </div>
                                        <div className="ml-3 text-sm text-slate-700 dark:text-slate-200 font-medium">
                                          {opt}
                                        </div>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {announcement.responseType === 'RSVP' && (!announcement.rsvpOptions || announcement.rsvpOptions.length === 0) && (
                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">RSVP Status</label>
                                  <input
                                    type="text"
                                    readOnly
                                    value={announcement.userResponse}
                                    className="input-field bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                  />
                                </div>
                              )}

                              {announcement.responseType === 'APPROVAL' && (
                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 mb-1.5">Reason for request</label>
                                  <textarea
                                    readOnly
                                    value={announcement.userResponse}
                                    className="input-field min-h-[100px] resize-y bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-100"
                                  />
                                </div>
                              )}
                            </div>

                            {/* EDIT AND REVOKE BUTTONS */}
                            {!hasDeadlinePassed && (
                              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
                                {announcement.responseType === 'RSVP' && announcement.submissionCount < 3 && (
                                  <button
                                    onClick={() => {
                                      setActiveFormId(announcement._id);
                                      setSelectedRsvpOption(announcement.userResponse || '');
                                    }}
                                    className="px-6 py-2 bg-brand-accent text-white font-semibold rounded-lg text-sm shadow-sm hover:bg-brand-accent/90 transition-colors"
                                  >
                                    Edit Response
                                  </button>
                                )}
                                {announcement.responseType === 'APPROVAL' && announcement.userResponseStatus === 'PENDING' && (
                                  <button
                                    onClick={() => revokeRequestMutation.mutate(announcement._id)}
                                    disabled={revokeRequestMutation.isPending}
                                    className="px-6 py-2 bg-red-100 text-red-600 font-semibold rounded-lg text-sm shadow-sm hover:bg-red-200 transition-colors disabled:opacity-50"
                                  >
                                    {revokeRequestMutation.isPending ? 'Revoking...' : 'Revoke Request'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
                            {((announcement.responseType === 'RSVP' && announcement.submissionCount >= 3) ||
                              (announcement.responseType === 'APPROVAL' && announcement.submissionCount >= 2)) ? (
                              <div className="text-center py-4">
                                <p className="text-sm font-semibold text-red-500">
                                  You have reached the maximum number of {announcement.responseType === 'APPROVAL' ? 'requests' : 'updates'} for this announcement.
                                </p>
                              </div>
                            ) : hasDeadlinePassed ? (
                              <div className="flex items-center justify-between">
                                <div className="mb-4 sm:mb-0 opacity-60">
                                  <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                    {announcement.responseType === 'APPROVAL' ? 'Approval Required' : 'RSVP Required'}
                                  </h4>
                                  <p className="text-xs text-slate-400 mt-1">This form is no longer accepting responses.</p>
                                </div>
                                <span className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold rounded-lg text-sm border border-slate-200 dark:border-slate-700 flex items-center">
                                  <XCircle className="w-4 h-4 mr-2" /> Closed
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                <div className="mb-4 sm:mb-0">
                                  <h4 className="text-sm font-bold text-brand-accent dark:text-blue-300">
                                    {announcement.responseType === 'APPROVAL' ? 'Approval Required' : 'RSVP Required'}
                                  </h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Please submit your response to proceed.</p>
                                </div>
                                <button
                                  onClick={() => {
                                    setActiveFormId(announcement._id);
                                    setReason('');
                                    setSelectedRsvpOption('');
                                  }}
                                  className="btn-primary px-6 py-2 shadow-sm whitespace-nowrap"
                                >
                                  {announcement.responseType === 'APPROVAL' ? 'Request Approval' : 'RSVP Now'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </>
  );
};

export default AnnouncementsPage;
