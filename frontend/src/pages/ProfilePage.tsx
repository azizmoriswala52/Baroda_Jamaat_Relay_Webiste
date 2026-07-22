import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, ArrowLeft, Edit2, X, Lock, Shield, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { useConfirm } from '../contexts/ConfirmContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import CustomDropdown from '../components/CustomDropdown';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';

const ProfilePage = () => {
  const navigate = useNavigate();
  useDocumentTitle('Profile');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    mohalla: 'Burhani',
    gender: 'Male'
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: boolean }>({});
  const [successMsg, setSuccessMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
  const [pwdStep, setPwdStep] = useState<0 | 1 | 2>(0);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const verifyPasswordMutation = useMutation({
    mutationFn: (oldPwd: string) => apiClient('/users/profile/verify-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword: oldPwd }),
    }),
    onSuccess: () => {
      setPwdError('');
      setPwdStep(2);
    },
    onError: (err: any) => {
      setPwdError(err.message || 'Incorrect old password');
    }
  });

  const { data: user, isLoading: isUserLoading, error } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => apiClient('/users/profile'),
  });

  const { data: mohallas, isLoading: isLoadingMohallas } = useQuery({
    queryKey: ['mohallas'],
    queryFn: () => apiClient('/mohallas'),
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        mobile: user.mobile || '',
        password: '', // Don't populate password
        mohalla: user.mohalla || 'Burhani',
        gender: user.gender || 'Male'
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof formData) => apiClient('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onSuccess: (data) => {
      setSuccessMsg('Profile updated successfully!');
      sessionStorage.setItem('user', JSON.stringify(data.user));
      setTimeout(() => setSuccessMsg(''), 3000);
      setFormData(prev => ({ ...prev, password: '' })); // Clear password field after save
      setIsEditing(false);
      // For security tab reset
      setPwdStep(1);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwdError('');
      setActiveTab('general');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: false });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      const errors: any = {};
      if (!formData.fullName.trim()) errors.fullName = true;
      if (!formData.mobile.trim()) errors.mobile = true;

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
    }

    const diff: any = {};
    if (user) {
      if (formData.fullName !== (user.fullName || '')) diff.fullName = formData.fullName;
      if (formData.email !== (user.email || '')) diff.email = formData.email;
      if (formData.mobile !== (user.mobile || '')) diff.mobile = formData.mobile;
      if (formData.gender !== (user.gender || 'Male')) diff.gender = formData.gender;
      if (formData.mohalla !== (user.mohalla || 'Burhani')) diff.mohalla = formData.mohalla;
      if (formData.password && formData.password.trim() !== '') {
        diff.password = formData.password;
      }
    }

    if (Object.keys(diff).length === 0) {
      setSuccessMsg('No changes were made.');
      setTimeout(() => setSuccessMsg(''), 3000);
      setIsEditing(false);
      return;
    }

    updateProfileMutation.mutate(diff as any);
  };

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

  if (isUserLoading || isLoadingMohallas) {
    return (
      <div className="min-h-screen flex items-center justify-center app-bg">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-accent mb-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center app-bg text-red-500">Error loading profile. Please login again.</div>;
  }

  const displayName = user?.role === 'ADMIN' ? `${user.fullName} (Admin)` : user?.fullName;

  return (
    <>
      <div className="mb-8 w-full">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-brand-accent dark:text-blue-300 tracking-wide">My Profile</h3>
        </div>
        <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-700 mt-2"></div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 items-start relative w-full">
        {/* Mobile Tabs */}
        <div className="w-full md:hidden bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 dark:border-slate-800 sticky top-0 z-20">
          <div className="flex overflow-x-auto hide-scrollbar p-3 space-x-2">
            <button
              onClick={() => setActiveTab('general')}
              className={`shrink-0 flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-sky-100 dark:bg-sky-900/40 text-brand-accent dark:text-blue-300 shadow-sm' : 'text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <User className="w-4 h-4 mr-2" /> General
            </button>
            <button
              onClick={() => {
                setActiveTab('security');
                setPwdStep(0);
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setConfirmTouched(false);
                setPwdError('');
                setIsEditing(false);
              }}
              className={`shrink-0 flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-sky-100 dark:bg-sky-900/40 text-brand-accent dark:text-blue-300 shadow-sm' : 'text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <Shield className="w-4 h-4 mr-2" /> Security
            </button>
            <button
              onClick={handleLogoutWithConfirm}
              className="shrink-0 flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
          </div>
        </div>

        {/* Desktop Sidebar Navigation */}
        <aside className="w-64 border-r border-slate-200 dark:border-slate-700 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900 p-6 hidden md:block sticky top-0 self-start max-h-[calc(100vh-10rem)] overflow-y-auto">
          <nav className="space-y-2">
            {/* <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 px-3">Profile</div> */}
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-sky-50 dark:bg-slate-800 text-brand-accent dark:text-blue-300 border border-sky-100 dark:border-slate-700 shadow-sm' : 'text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <User className="w-4 h-4 mr-3" /> General
            </button>
            <button
              onClick={() => {
                setActiveTab('security');
                setPwdStep(0);
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setConfirmTouched(false);
                setPwdError('');
                setIsEditing(false);
              }}
              className={`w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-sky-50 dark:bg-slate-800 text-brand-accent dark:text-blue-300 border border-sky-100 dark:border-slate-700 shadow-sm' : 'text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <Shield className="w-4 h-4 mr-3" /> Security
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 w-full max-w-[100vw] md:max-w-none overflow-x-hidden">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 pb-10"
          >
            {successMsg && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                {successMsg}
              </div>
            )}
            {updateProfileMutation.isError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                Error updating profile.
              </div>
            )}

            {/* Profile Overview */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-slate-200 dark:border-slate-700 gap-6">
              <div className="flex items-center space-x-4 sm:space-x-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:border-slate-600 flex items-center justify-center shadow-sm">
                  <User className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-1 text-slate-800 dark:text-slate-100 break-words">{user?.fullName}</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">ITS: {user?.itsId}</p>
                </div>
              </div>
              {!isEditing && activeTab === 'general' && (
                <button onClick={() => setIsEditing(true)} className="btn-primary flex items-center justify-center w-full sm:w-auto shrink-0">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>

            {/* Form Fields */}
            {activeTab === 'general' ? (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-w-3xl">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Full Name</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={`input-field ${!isEditing ? 'bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed' : formErrors.fullName ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20 animate-gentle-shake' : ''}`} disabled={!isEditing} />
                  {formErrors.fullName && <p className="text-red-500 dark:text-red-400 text-xs px-1 mt-1">Full Name is required</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className={`input-field ${!isEditing ? 'bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed' : ''}`} disabled={!isEditing} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Mobile Number</label>
                  <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} className={`input-field ${!isEditing ? 'bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed' : formErrors.mobile ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20 animate-gentle-shake' : ''}`} disabled={!isEditing} />
                  {formErrors.mobile && <p className="text-red-500 dark:text-red-400 text-xs px-1 mt-1">Mobile Number is required</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Gender</label>
                  {isEditing ? (
                    <CustomDropdown
                      options={[
                        { label: 'Male', value: 'Male' },
                        { label: 'Female', value: 'Female' }
                      ]}
                      value={formData.gender}
                      onChange={(val) => setFormData({ ...formData, gender: val })}
                    />
                  ) : (
                    <input type="text" className="input-field bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed" value={formData.gender || 'Male'} disabled />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Mohallah</label>
                  <input
                    type="text"
                    className="input-field bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    value={(() => {
                      const childName = user?.mohalla || 'Burhani';
                      const parentName = mohallas?.find((m: any) => m.name === childName)?.parentMohalla;
                      return parentName ? `${childName} Mohallah (${parentName} Mohallah)` : `${childName} Mohallah`;
                    })()}
                    disabled
                  />
                  {isEditing && (
                    <p className="text-xs text-brand-accent dark:text-blue-300 mt-2 font-medium">To change your Mohallah, please contact your Aamil Saheb.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Jamaat Name</label>
                  <input type="text" className="input-field bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed" value={user?.jamaatName || ''} disabled />
                </div>

                {isEditing && (
                  <div className="md:col-span-2 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-4">
                    <button type="button" onClick={() => {
                      setIsEditing(false);
                      if (user) {
                        setFormData({
                          fullName: user.fullName || '',
                          email: user.email || '',
                          mobile: user.mobile || '',
                          password: '',
                          mohalla: user.mohalla || 'Burhani',
                          gender: user.gender || 'Male'
                        });
                      }
                    }} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={updateProfileMutation.isPending} className="btn-primary">
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </form>
            ) : (
              <div className="space-y-8 max-w-xl">
                {pwdStep === 0 ? (
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="text-brand-accent dark:text-blue-300 shrink-0">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Account Security</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Ensure your account is using a long, random password to stay secure.</p>
                    </div>
                    <button
                      onClick={() => setPwdStep(1)}
                      className="btn-primary"
                    >
                      Update Password
                    </button>
                  </div>
                ) : pwdStep === 1 ? (
                  <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!oldPassword.trim()) {
                        setPwdError('Current password is required');
                        return;
                      }
                      verifyPasswordMutation.mutate(oldPassword);
                    }} className="space-y-6">
                    <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-slate-100">
                      <div className="text-brand-accent dark:text-blue-300 shrink-0">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Update Password</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Step 1 of 2: Enter your current password</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="md:col-span-2 max-w-md">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Current Password</label>
                        <div className="relative">
                          <input
                            type={showOldPassword ? "text" : "password"}
                            value={oldPassword}
                            onChange={(e) => { setOldPassword(e.target.value); setPwdError(''); }}
                            className={`input-field pr-10 ${pwdError ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500 animate-gentle-shake' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:text-slate-300 focus:outline-none"
                          >
                            {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {pwdError && <p className="text-red-500 text-xs mt-2 font-medium">{pwdError}</p>}
                      </div>
                    </div>
                    <div className="flex justify-start pt-4 space-x-4">
                      <button type="button" onClick={() => { setPwdStep(0); setOldPassword(''); setPwdError(''); }} className="btn-secondary">
                        Cancel
                      </button>
                      <button type="submit" disabled={verifyPasswordMutation.isPending} className="btn-primary">
                        {verifyPasswordMutation.isPending ? 'Verifying...' : 'Next Step'}
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      setConfirmTouched(true);
                      if (!newPassword.trim() || !confirmPassword.trim()) {
                        setPwdError('Password is required');
                        return;
                      }
                      if (newPassword === oldPassword) {
                        setPwdError('New password must be different from current password');
                        return;
                      }
                      if (newPassword !== confirmPassword) {
                        setPwdError("Password does'nt matches!");
                        return;
                      }
                      updateProfileMutation.mutate({ password: newPassword } as any);
                    }} className="space-y-6">
                    <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-slate-100">
                      <div className="text-brand-accent dark:text-blue-300 shrink-0">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Update Password</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Step 2 of 2: Choose a new password</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => { setNewPassword(e.target.value); setPwdError(''); }}
                            className="input-field pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:text-slate-300 focus:outline-none"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setPwdError(''); }}
                            onBlur={() => setConfirmTouched(true)}
                            className={`input-field pr-10 ${confirmTouched && confirmPassword
                              ? confirmPassword === newPassword
                                ? 'border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500'
                                : 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500 animate-gentle-shake'
                              : pwdError
                                ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500 animate-gentle-shake'
                                : ''
                              }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:text-slate-300 focus:outline-none"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {confirmTouched && confirmPassword && confirmPassword === newPassword && !pwdError && (
                          <p className="text-green-500 text-xs mt-2 font-medium flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Password matches!
                          </p>
                        )}
                        {confirmTouched && confirmPassword && confirmPassword !== newPassword && !pwdError && (
                          <p className="text-red-500 text-xs mt-2 font-medium flex items-center">
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Password doesn't match!
                          </p>
                        )}
                        {pwdError && <p className="text-red-500 text-xs mt-2 font-medium">{pwdError}</p>}
                      </div>
                    </div>
                    <div className="flex justify-start space-x-4 pt-4 border-t border-slate-100 mt-4">
                      <button type="button" onClick={() => { setPwdStep(0); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); setConfirmTouched(false); setPwdError(''); }} className="btn-secondary">
                        Cancel
                      </button>
                      <button type="submit" disabled={updateProfileMutation.isPending} className="btn-primary">
                        {updateProfileMutation.isPending ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </motion.form>
                )}
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default ProfilePage;
