import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';
import { HelpCircle, Send } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const HelpSupportPage = () => {
  useDocumentTitle('Help & Support');
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    city: '',
    mohalla: '',
    query: ''
  });
  
  const [formErrors, setFormErrors] = useState({
    name: false,
    mobile: false,
    city: false,
    mohalla: false,
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
      setFormData({ name: '', mobile: '', city: '', mohalla: '', query: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit query');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({ name: false, mobile: false, city: false, mohalla: false, query: false });
    
    const newErrors = {
      name: !formData.name.trim(),
      mobile: !formData.mobile.trim(),
      city: !formData.city.trim(),
      mohalla: !formData.mohalla.trim(),
      query: !formData.query.trim()
    };

    if (Object.values(newErrors).some(Boolean)) {
      setFormErrors(newErrors);
      toast.error('All fields are required');
      return;
    }
    submitQueryMutation.mutate(formData);
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

      <div className="max-w-4xl">
        <div className="clean-panel p-8 relative">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Contact Support</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={`input-field ${formErrors.name ? 'border-red-500 bg-red-50 animate-gentle-shake' : ''}`}
                />
                {formErrors.name && <p className="text-red-500 text-xs px-1">Full Name is required</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Mobile Number</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Enter your mobile number"
                  className={`input-field ${formErrors.mobile ? 'border-red-500 bg-red-50 animate-gentle-shake' : ''}`}
                />
                {formErrors.mobile && <p className="text-red-500 text-xs px-1">Mobile Number is required</p>}
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">City / Town</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Which city or town are you from?"
                  className={`input-field ${formErrors.city ? 'border-red-500 bg-red-50 animate-gentle-shake' : ''}`}
                />
                {formErrors.city && <p className="text-red-500 text-xs px-1">City / Town is required</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Mohalla</label>
                <input
                  type="text"
                  name="mohalla"
                  value={formData.mohalla}
                  onChange={handleChange}
                  placeholder="Enter your mohalla name"
                  className={`input-field ${formErrors.mohalla ? 'border-red-500 bg-red-50 animate-gentle-shake' : ''}`}
                />
                {formErrors.mohalla && <p className="text-red-500 text-xs px-1">Mohalla is required</p>}
              </div>
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

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitQueryMutation.isPending}
                className="w-full btn-primary py-3 flex justify-center items-center text-base"
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
