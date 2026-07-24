import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, color } from 'framer-motion';
import { Check, Megaphone, Calendar, CheckCircle2, ShieldAlert, RefreshCw, Clock, XCircle } from 'lucide-react';
import { apiClient } from '../api/apiClient';
import { toast } from 'react-hot-toast';
import CustomDropdown from '../components/CustomDropdown';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useConfirm } from '../contexts/ConfirmContext';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  responseType: 'NONE' | 'APPROVAL' | 'RSVP' | 'FORM';
  createdAt: string;
  rsvpOptions?: string[];
  formFields?: { name: string; type: string; options: string[]; required: boolean }[];
  deadline?: string;
  targetParentMohallas?: string[];
  targetChildMohallas?: string[];
  userResponse?: string | null;
  userFormData?: Record<string, any> | null;
  userResponseStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED' | null;
  submissionCount: number;
}

const AnnouncementsPage = () => {
  useDocumentTitle('Announcements');
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [selectedRsvpOption, setSelectedRsvpOption] = useState<string>('');
  const [formDataValues, setFormDataValues] = useState<Record<string, any>>({});

  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const { data: announcements = [], isLoading, refetch, isFetching } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: () => apiClient('/site-announcements'),
  });

  const submitResponseMutation = useMutation({
    mutationFn: ({ id, response, formData }: { id: string; response?: string; formData?: Record<string, any> }) =>
      apiClient(`/site-announcements/${id}/rsvp`, {
        method: 'POST',
        body: JSON.stringify({ response, formData }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Your response has been recorded.');
      setActiveFormId(null);
      setReason('');
      setSelectedRsvpOption('');
      setFormDataValues({});
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
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row overflow-visible"
                >
                  {/* DATE COLUMN */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 md:w-48 p-6 md:p-8 flex flex-row md:flex-col justify-between md:justify-center items-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700 shrink-0 text-center rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
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
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                          announcement.responseType === 'APPROVAL' ? 'bg-amber-100 text-amber-700' :
                          announcement.responseType === 'FORM' ? 'bg-purple-100 text-purple-700' :
                          'bg-brand-accent/10 text-brand-accent dark:text-blue-300'
                        }`}>
                          {announcement.responseType === 'APPROVAL' ? 'Needs Approval' : 
                           announcement.responseType === 'FORM' ? 'Form Required' : 
                           'RSVP Required'}
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
                              className="clean-panel p-5 !overflow-visible"
                            >
                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-100 pb-3 flex items-center">
                                {announcement.responseType === 'APPROVAL' ? (
                                  <><ShieldAlert className="w-4 h-4 mr-2" style={{ color: 'var(--color-brand-accent dark:text-blue-300)' }} /> Request Approval</>
                                ) : announcement.responseType === 'RSVP' ? (
                                  <><CheckCircle2 className="w-4 h-4 mr-2" style={{ color: 'var(--color-brand-accent dark:text-blue-300)' }} /> Confirm RSVP</>
                                ) : (
                                  <><CheckCircle2 className="w-4 h-4 mr-2" style={{ color: 'var(--color-brand-accent dark:text-blue-300)' }} /> Complete Form</>
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
                                            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setSelectedRsvpOption(opt)}>
                                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                                                selectedRsvpOption === opt 
                                                  ? 'border-brand-accent text-brand-accent bg-brand-accent/10' 
                                                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-slate-400 dark:group-hover:border-slate-500'
                                              }`}>
                                                {selectedRsvpOption === opt && <div className="w-2 h-2 rounded-full bg-brand-accent" />}
                                              </div>
                                              <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">{opt}</span>
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

                                {announcement.responseType === 'FORM' && announcement.formFields && (
                                  <div className="space-y-4">
                                    {announcement.formFields.map((field, idx) => (
                                      <div key={idx}>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                                          {field.name} {field.required && <span className="text-red-500">*</span>}
                                        </label>
                                        {field.type === 'text' && (
                                          <input
                                            type="text"
                                            value={formDataValues[`${announcement._id}_${idx}`] || ''}
                                            onChange={(e) => setFormDataValues(prev => ({ ...prev, [`${announcement._id}_${idx}`]: e.target.value }))}
                                            className="input-field"
                                          />
                                        )}
                                        {field.type === 'textarea' && (
                                          <textarea
                                            value={formDataValues[`${announcement._id}_${idx}`] || ''}
                                            onChange={(e) => setFormDataValues(prev => ({ ...prev, [`${announcement._id}_${idx}`]: e.target.value }))}
                                            className="input-field min-h-[80px] resize-y"
                                          />
                                        )}
                                        {field.type === 'dropdown' && (
                                          <CustomDropdown
                                            options={(typeof field.options === 'string' ? field.options.split(',').map(o => o.trim()).filter(Boolean) : (Array.isArray(field.options) ? field.options : [])).map((opt) => ({ label: opt, value: opt }))}
                                            value={formDataValues[`${announcement._id}_${idx}`] || ''}
                                            onChange={(val) => setFormDataValues(prev => ({ ...prev, [`${announcement._id}_${idx}`]: val }))}
                                          />
                                        )}
                                        {field.type === 'radio' && (
                                          <div className="space-y-2">
                                            {(typeof field.options === 'string' ? field.options.split(',').map(o => o.trim()).filter(Boolean) : (Array.isArray(field.options) ? field.options : [])).map((opt, i) => (
                                              <label key={i} className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${formDataValues[`${announcement._id}_${idx}`] === opt ? 'border-brand-accent bg-brand-accent/5' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600'}`}>
                                                <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setFormDataValues(prev => ({ ...prev, [`${announcement._id}_${idx}`]: opt }))}>
                                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                                                    formDataValues[`${announcement._id}_${idx}`] === opt 
                                                      ? 'border-brand-accent text-brand-accent bg-brand-accent/10' 
                                                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-slate-400 dark:group-hover:border-slate-500'
                                                  }`}>
                                                    {formDataValues[`${announcement._id}_${idx}`] === opt && <div className="w-2 h-2 rounded-full bg-brand-accent" />}
                                                  </div>
                                                  <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">{opt}</span>
                                                </div>
                                              </label>
                                            ))}
                                          </div>
                                        )}
                                        {field.type === 'checkbox' && (
                                          <div className="space-y-2">
                                            {(typeof field.options === 'string' ? field.options.split(',').map(o => o.trim()).filter(Boolean) : (Array.isArray(field.options) ? field.options : [])).map((opt, i) => {
                                              const currentValues = formDataValues[`${announcement._id}_${idx}`] || [];
                                              return (
                                                <label key={i} className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${currentValues.includes(opt) ? 'border-brand-accent bg-brand-accent/5' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600'}`}>
                                                  <div 
                                                    className="flex items-center space-x-3 cursor-pointer group" 
                                                    onClick={() => {
                                                      const isChecked = !currentValues.includes(opt);
                                                      setFormDataValues(prev => {
                                                        const prevVals = prev[`${announcement._id}_${idx}`] || [];
                                                        return {
                                                          ...prev,
                                                          [`${announcement._id}_${idx}`]: isChecked ? [...prevVals, opt] : prevVals.filter((v: string) => v !== opt)
                                                        };
                                                      });
                                                    }}
                                                  >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                                      currentValues.includes(opt) 
                                                        ? 'bg-brand-accent border-brand-accent text-white' 
                                                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-slate-400 dark:group-hover:border-slate-500'
                                                    }`}>
                                                      {currentValues.includes(opt) && <Check className="w-3 h-3" />}
                                                    </div>
                                                    <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">{opt}</span>
                                                  </div>
                                                </label>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    ))}
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
                                    onClick={() => {
                                      const payloadFormData: Record<string, any> = {};
                                      if (announcement.responseType === 'FORM' && announcement.formFields) {
                                        announcement.formFields.forEach((f, idx) => {
                                          payloadFormData[f.name] = formDataValues[`${announcement._id}_${idx}`];
                                        });
                                      }
                                      submitResponseMutation.mutate({
                                        id: announcement._id,
                                        response: announcement.responseType === 'APPROVAL' ? reason : (announcement.responseType === 'RSVP' ? (announcement.rsvpOptions && announcement.rsvpOptions.length > 0 ? selectedRsvpOption : 'Confirmed') : undefined),
                                        formData: announcement.responseType === 'FORM' ? payloadFormData : undefined
                                      });
                                    }}
                                    disabled={
                                      submitResponseMutation.isPending || 
                                      (announcement.responseType === 'APPROVAL' && !reason.trim()) || 
                                      (announcement.responseType === 'RSVP' && announcement.rsvpOptions && announcement.rsvpOptions.length > 0 && !selectedRsvpOption) ||
                                      (announcement.responseType === 'FORM' && announcement.formFields?.some((f, idx) => f.required && (!formDataValues[`${announcement._id}_${idx}`] || (Array.isArray(formDataValues[`${announcement._id}_${idx}`]) && formDataValues[`${announcement._id}_${idx}`].length === 0))))
                                    }
                                    className="btn-primary px-6 shadow-sm disabled:opacity-50"
                                  >
                                    {submitResponseMutation.isPending ? 'Submitting...' : 'Submit'}
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        ) : (announcement.userResponse || (announcement.responseType === 'FORM' && announcement.submissionCount > 0)) && announcement.userResponseStatus !== 'REVOKED' ? (
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
                                    value={announcement.userResponse || ''}
                                    className="input-field min-h-[100px] resize-y bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-100"
                                  />
                                </div>
                              )}

                              {announcement.responseType === 'FORM' && announcement.userFormData && (
                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 mb-2 uppercase tracking-wide">Submitted Form Data</label>
                                  <div className="space-y-3 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    {Object.entries(announcement.userFormData).map(([key, value]) => (
                                      <div key={key}>
                                        <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-0.5">{key}</span>
                                        <span className="text-sm text-slate-700 dark:text-slate-200">
                                          {Array.isArray(value) ? value.join(', ') : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                                        </span>
                                      </div>
                                    ))}
                                    {Object.keys(announcement.userFormData).length === 0 && (
                                      <span className="text-sm text-slate-500 italic">No data submitted.</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* EDIT AND REVOKE BUTTONS */}
                            {!hasDeadlinePassed && (
                              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
                                {['RSVP', 'FORM'].includes(announcement.responseType) && announcement.submissionCount < 5 && (
                                  <button
                                    onClick={() => {
                                      setActiveFormId(announcement._id);
                                      if (announcement.responseType === 'RSVP') {
                                        setSelectedRsvpOption(announcement.userResponse || '');
                                      } else if (announcement.responseType === 'FORM') {
                                        const prefilledData: Record<string, any> = {};
                                        if (announcement.userFormData && announcement.formFields) {
                                          announcement.formFields.forEach((field, idx) => {
                                            prefilledData[`${announcement._id}_${idx}`] = announcement.userFormData![field.name];
                                          });
                                        }
                                        setFormDataValues(prev => ({ ...prev, ...prefilledData }));
                                      }
                                    }}
                                    className="px-6 py-2 bg-brand-accent text-white font-semibold rounded-lg text-sm shadow-sm hover:bg-brand-accent/90 transition-colors"
                                  >
                                    Edit Response
                                  </button>
                                )}
                                {announcement.responseType === 'APPROVAL' && announcement.userResponseStatus === 'PENDING' && (
                                  <button
                                    onClick={async () => {
                                      if (await confirm('Are you sure you want to revoke this request?', { confirmText: 'Revoke' })) {
                                        revokeRequestMutation.mutate(announcement._id);
                                      }
                                    }}
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
                              (announcement.responseType === 'APPROVAL' && announcement.submissionCount >= 2) ||
                              (announcement.responseType === 'FORM' && announcement.submissionCount >= 5)) ? (
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
