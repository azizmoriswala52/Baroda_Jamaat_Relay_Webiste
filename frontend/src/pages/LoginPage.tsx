import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';
import { HelpCircle, Send, ArrowLeft, AlertCircle } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { motion, AnimatePresence } from 'framer-motion';

const LoginPage = () => {
  // Login State
  const [itsId, setItsId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ itsId?: boolean, password?: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  useDocumentTitle('Sign In');

  // Issue Form State
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueFormData, setIssueFormData] = useState({ itsId: '', issueDescription: '' });
  const [issueFormErrors, setIssueFormErrors] = useState({ itsId: false, issueDescription: false });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError('');
    setFieldErrors({});

    let hasErrors = false;
    const newFieldErrors = { itsId: false, password: false };

    if (!itsId.trim() || !/^\d{8}$/.test(itsId.trim())) {
      newFieldErrors.itsId = true;
      hasErrors = true;
    }
    if (!password.trim()) {
      newFieldErrors.password = true;
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(newFieldErrors);
      if (newFieldErrors.itsId) {
        toast.error('ITS ID must be exactly 8 digits');
      } else {
        toast.error('Please fill in all required fields');
      }
      return;
    }

    setIsLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itsId: itsId.trim(), password })
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Login successful!');
        navigate('/home');
      } else {
        const errMsg = data.message || 'Invalid credentials';
        setError(errMsg);
        if (response.status === 403) {
          toast.error(errMsg);
        } else {
          toast.error('Login failed: ' + errMsg);
        }
        setIsLoading(false);
      }
    } catch (err) {
      setError('Cannot connect to backend server. Make sure MongoDB is running.');
      toast.error('Login failed');
      setIsLoading(false);
    }
  };

  const [issueServerError, setIssueServerError] = useState('');

  const submitIssueMutation = useMutation({
    mutationFn: async (data: any) => {
      const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
      const res = await fetch(`${API_BASE_URL}/login-issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to submit issue');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Your login issue has been submitted successfully!');
      setIssueFormData({ itsId: '', issueDescription: '' });
      setShowIssueForm(false);
      setIssueServerError('');
    },
    onError: (error: any) => {
      if (error.message === 'Your ITS ID is not registered' || error.message.includes('not registered')) {
        setIssueServerError('Your ITS ID is not registered');
      } else {
        toast.error(error.message || 'Failed to submit issue');
      }
    }
  });

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIssueFormErrors({ itsId: false, issueDescription: false });

    const newErrors = {
      itsId: !issueFormData.itsId.trim() || !/^\d{8}$/.test(issueFormData.itsId.trim()),
      issueDescription: !issueFormData.issueDescription.trim()
    };

    if (Object.values(newErrors).some(Boolean)) {
      setIssueFormErrors(newErrors);
      if (newErrors.itsId) {
        toast.error('ITS ID must be exactly 8 digits');
      } else {
        toast.error('All fields are required', { icon: <AlertCircle className="w-5 h-5 text-brand-accent" /> });
      }
      return;
    }
    submitIssueMutation.mutate(issueFormData);
  };

  const handleIssueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value = e.target.value;
    if (e.target.name === 'itsId') {
      value = value.replace(/\D/g, '').slice(0, 8);
    } else {
      if (issueFormErrors.issueDescription) setIssueFormErrors({ ...issueFormErrors, issueDescription: false });
    }
    setIssueFormData({ ...issueFormData, [e.target.name]: value });
  };

  useEffect(() => {
    if (!showIssueForm) return;

    const verifyId = async () => {
      const itsId = issueFormData.itsId.trim();
      if (itsId.length > 0 && itsId.length < 8) {
        setIssueFormErrors(prev => ({ ...prev, itsId: true }));
        setIssueServerError('');
      } else if (itsId.length === 8) {
        setIssueFormErrors(prev => ({ ...prev, itsId: false }));
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
          const res = await fetch(`${API_BASE_URL}/login-issues/verify-its/${itsId}`);
          if (!res.ok) {
            setIssueServerError('This ITS ID is not registered in Baroda Jamaat.');
          } else {
            setIssueServerError('');
          }
        } catch (error) {
          // Ignore network errors for real-time check
        }
      } else {
        setIssueFormErrors(prev => ({ ...prev, itsId: false }));
        setIssueServerError('');
      }
    };

    const timer = setTimeout(() => {
      verifyId();
    }, 400); // Debounce to allow user to type

    return () => clearTimeout(timer);
  }, [issueFormData.itsId, showIssueForm]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-brand-bg overflow-hidden">
      {/* Decorative Fatimid Geometric Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--color-brand-accent) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Top Logo Section */}
        <div className="mb-8 flex flex-col items-center">
          {/* Calligraphy Logo */}
          <div className="w-64 h-16 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Bismillah_Calligraphy.svg/1024px-Bismillah_Calligraphy.svg.png')] bg-contain bg-center bg-no-repeat mb-2 opacity-80" style={{ filter: 'brightness(0) sepia(1) hue-rotate(180deg) saturate(3) brightness(0.4)' }}></div>
          <p className="text-brand-accent text-xs font-bold tracking-[0.2em] uppercase">Baroda Jamaat</p>
        </div>

        {/* Main Login Card - Adjusted dimensions */}
        <div className={`w-full ${showIssueForm ? 'max-w-[500px]' : 'max-w-[400px]'} clean-panel bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-200 transition-all duration-300`}>
          <div className="px-10 py-16 relative">
            <AnimatePresence mode="wait">
              {!showIssueForm ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="text-3xl text-center text-slate-800 mb-10 font-light tracking-wide">Sign In</h2>
                  <form className="space-y-5" onSubmit={handleLogin} noValidate>
                    {error && (
                      <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100 font-medium">
                        {error}
                      </div>
                    )}

                    <div className="space-y-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        className={`input-field focus:bg-white focus:border-brand-accent text-slate-800 ${fieldErrors.itsId ? '!border-red-500 !bg-red-50 animate-gentle-shake' : 'bg-slate-200 border-transparent'} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        placeholder="ITS ID"
                        value={itsId}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                          setItsId(val);
                          if (fieldErrors.itsId) setFieldErrors({ ...fieldErrors, itsId: false });
                        }}
                        onBlur={(e) => {
                          if (!/^\d{8}$/.test(e.target.value.trim())) {
                            setFieldErrors((prev) => ({ ...prev, itsId: true }));
                          }
                        }}
                      />
                      {fieldErrors.itsId && <p className="text-red-500 text-xs px-1">ITS ID must be exact 8 digits</p>}
                    </div>

                    <div className="space-y-1">
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className={`input-field pr-10 focus:bg-white focus:border-brand-accent text-slate-800 ${fieldErrors.password ? '!border-red-500 !bg-red-50 animate-gentle-shake' : 'bg-slate-200 border-transparent'}`}
                          placeholder="Password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: false });
                          }}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-brand-accent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                            <motion.line
                              x1="2" y1="2" x2="22" y2="22"
                              initial={false}
                              animate={{ pathLength: !showPassword ? 1 : 0, opacity: !showPassword ? 1 : 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                            />
                          </svg>
                        </button>
                      </div>
                      {fieldErrors.password && <p className="text-red-500 text-xs px-1">Password is required</p>}
                    </div>

                    <div className="flex items-center justify-between pt-6">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-24 flex items-center justify-center text-sm py-2.5"
                      >
                        {isLoading ? (
                          <span className="w-5 h-5 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin"></span>
                        ) : (
                          "Login"
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowIssueForm(true)}
                        className="text-sm text-brand-accent hover:text-brand-accent-hover transition-colors bg-transparent border-none p-0 cursor-pointer"
                      >
                        Issue with login?
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="issue"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    type="button"
                    onClick={() => setShowIssueForm(false)}
                    className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-brand-accent transition-colors mb-6 bg-transparent border-none p-0 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
                  </button>

                  <div className="flex items-center space-x-3 mb-8">
                    <HelpCircle className="w-5 h-5 text-brand-accent shrink-0" />
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800 leading-none mb-1">Login Issue</h2>
                      <p className="text-sm text-slate-500">Submit your details to get help.</p>
                    </div>
                  </div>

                  <form onSubmit={handleIssueSubmit} className="space-y-5">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">ITS ID</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        name="itsId"
                        value={issueFormData.itsId}
                        onChange={handleIssueChange}
                        onBlur={(e) => {
                          if (!/^\d{8}$/.test(e.target.value.trim())) {
                            setIssueFormErrors((prev) => ({ ...prev, itsId: true }));
                          }
                        }}
                        placeholder="Enter your 8-digit ITS Number"
                        className={`input-field [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${issueFormErrors.itsId || issueServerError ? '!border-red-500 !bg-red-50 animate-gentle-shake' : 'bg-slate-50 focus:bg-white focus:border-brand-accent'}`}
                      />
                      {issueFormErrors.itsId && <p className="text-red-500 text-xs px-1">ITS ID must be exact 8 digits</p>}
                      {issueServerError && <p className="text-red-500 text-xs px-1 font-semibold">{issueServerError}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Describe your issue</label>
                      <textarea
                        name="issueDescription"
                        value={issueFormData.issueDescription}
                        onChange={handleIssueChange}
                        placeholder="I am unable to login because..."
                        rows={3}
                        className={`input-field resize-y ${issueFormErrors.issueDescription ? '!border-red-500 !bg-red-50 animate-gentle-shake' : 'bg-slate-50 focus:bg-white focus:border-brand-accent'}`}
                      />
                      {issueFormErrors.issueDescription && <p className="text-red-500 text-xs px-1">Issue Description is required</p>}
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={submitIssueMutation.isPending}
                        className="w-full btn-primary py-3 flex justify-center items-center text-sm font-semibold"
                      >
                        {submitIssueMutation.isPending ? (
                          <span className="flex items-center">
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Card Footer */}
          <div className="bg-brand-accent py-6 text-center relative overflow-hidden">
            {/* Dawoodi Bohra Fatimid Shurafat (Stepped Crenellations) */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg stroke='%23D4AF37' stroke-width='1.5' stroke-opacity='0.8' stroke-linejoin='round'%3E%3Cpath d='M 0 45 H 10 V 35 H 15 V 25 H 20 V 15 H 25 V 5 H 35 V 15 H 40 V 25 H 45 V 35 H 50 V 45 H 60 V 60 H 0 Z M 26 35 H 34 V 28 A 4 4 0 0 0 26 28 Z' fill='%23D4AF37' fill-opacity='0.25' fill-rule='evenodd' /%3E%3Cpath d='M 0 48 H 60 M 0 58 H 60' fill='none' /%3E%3Ccircle cx='30' cy='53' r='2.5' fill='%23D4AF37' fill-opacity='0.5' stroke='none' /%3E%3Cpath d='M 12 53 H 18 M 42 53 H 48' fill='none' stroke-width='2.5' /%3E%3Ccircle cx='0' cy='53' r='2.5' fill='%23D4AF37' fill-opacity='0.5' stroke='none' /%3E%3Ccircle cx='60' cy='53' r='2.5' fill='%23D4AF37' fill-opacity='0.5' stroke='none' /%3E%3C/g%3E%3C/svg%3E\")",
                backgroundRepeat: "repeat-x",
                backgroundPosition: "bottom",
                backgroundSize: "40px 40px"
              }}
            ></div>
            <p className="text-white text-[11px] font-bold tracking-widest uppercase opacity-90 relative z-10">Live Streaming / Recording</p>
          </div>
        </div>

        {/* Copyright Footer */}
        <div className="mt-8 text-center z-10">
          <p className="text-[11px] text-slate-500 font-semibold tracking-wide">2026 Copyright © Burhani Mohalla - Baroda</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
