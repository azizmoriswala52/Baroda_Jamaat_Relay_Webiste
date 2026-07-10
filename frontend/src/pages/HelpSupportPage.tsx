import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';
import { HelpCircle, Send } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const HelpSupportPage = () => {
  useDocumentTitle('Help & Support');
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [formData, setFormData] = useState({
    query: ''
  });
  
  const [formErrors, setFormErrors] = useState({
    query: false
  });

  const submitQueryMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient('/support', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast.success('Your support query has been submitted successfully!');
      setFormData({ query: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit query');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({ query: false });
    
    if (!formData.query.trim()) {
      setFormErrors({ query: true });
      toast.error('Support description is required');
      return;
    }

    const submitData = {
      itsId: user?.itsId || 'Unknown',
      name: user?.fullName || 'Unknown',
      mobile: user?.mobile || 'Unknown',
      city: user?.jamaatName || 'Unknown',
      mohalla: user?.mohalla || 'Burhani',
      query: formData.query
    };

    submitQueryMutation.mutate(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name as keyof typeof formErrors]) {
      setFormErrors({ ...formErrors, [e.target.name]: false });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="pb-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Help & Support</h2>
        <p className="text-sm text-slate-500">Submit your queries and we will get back to you shortly</p>
      </div>

      <div className="max-w-2xl">
        <div className="clean-panel p-8 relative">
          <div className="flex items-center space-x-3 mb-6">
            <HelpCircle className="w-5 h-5 text-brand-accent shrink-0" />
            <h3 className="text-xl font-bold text-slate-800">Contact Support</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">ITS ID</label>
                <input
                  type="text"
                  value={user?.itsId || ''}
                  disabled
                  className="input-field bg-slate-100 text-slate-500 cursor-not-allowed border-transparent"
                />
              </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">What help or support do you need from us?</label>
              <textarea
                name="query"
                value={formData.query}
                onChange={handleChange}
                placeholder="Describe your issue or request in detail..."
                rows={4}
                className={`input-field resize-y ${formErrors.query ? 'border-red-500 bg-red-50 animate-gentle-shake' : ''}`}
              />
              {formErrors.query && <p className="text-red-500 text-xs px-1">Support description is required</p>}
            </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-2">
              <button
                type="submit"
                disabled={submitQueryMutation.isPending}
                className="btn-primary inline-flex justify-center items-center"
              >
                {submitQueryMutation.isPending ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-brand-accent" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Support Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default HelpSupportPage;
