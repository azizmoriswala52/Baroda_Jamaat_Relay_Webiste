import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, ArrowLeft, Edit2, X } from 'lucide-react';
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
    mohalla: '',
    gender: ''
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);

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
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
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
      navigate('/login');
    }
  };

  if (isUserLoading || isLoadingMohallas) {
    return <div className="min-h-screen flex items-center justify-center bg-brand-bg">Loading profile...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-brand-bg text-red-500">Error loading profile. Please login again.</div>;
  }

  const displayName = user?.role === 'ADMIN' ? `${user.fullName} (Admin)` : user?.fullName;

  return (
    <>
      <div className="max-w-5xl mx-auto w-full">

        {/* Mobile Tabs */}
        <div className="w-full lg:hidden bg-slate-50 border-b border-slate-200 sticky top-0 z-20 -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 mb-8">
          <div className="flex overflow-x-auto hide-scrollbar py-3 space-x-2">
            <button className="shrink-0 flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors bg-sky-100 text-brand-accent shadow-sm">
              <User className="w-4 h-4 mr-2" /> General
            </button>
            <button 
              onClick={handleLogoutWithConfirm}
              className="shrink-0 flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block lg:col-span-1">
            <nav className="flex flex-col space-y-1 sticky top-0 self-start">
              <a href="#" className="px-4 py-2.5 rounded-md bg-white border border-slate-200 text-brand-accent text-sm font-medium shadow-sm flex items-center">
                <User className="w-4 h-4 mr-2" /> General
              </a>
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-10">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-slate-200 gap-6">
                <div className="flex items-center space-x-4 sm:space-x-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <User className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold mb-1 text-slate-800 break-words">{user?.fullName}</h2>
                    <p className="text-slate-500 text-sm">ITS: {user?.itsId}</p>
                  </div>
                </div>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="btn-secondary flex items-center justify-center w-full sm:w-auto shrink-0">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Full Name</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={`input-field ${!isEditing ? 'bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed' : ''}`} disabled={!isEditing} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className={`input-field ${!isEditing ? 'bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed' : ''}`} disabled={!isEditing} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Mobile Number</label>
                  <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} className={`input-field ${!isEditing ? 'bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed' : ''}`} disabled={!isEditing} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Gender</label>
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
                    <input type="text" className="input-field bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed" value={formData.gender || 'Male'} disabled />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Mohallah</label>
                  <input 
                    type="text" 
                    className="input-field bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed" 
                    value={(() => {
                      const childName = user?.mohalla || 'Burhani';
                      const parentName = mohallas?.find((m: any) => m.name === childName)?.parentMohalla;
                      return parentName ? `${childName} Mohallah (${parentName} Mohallah)` : `${childName} Mohallah`;
                    })()} 
                    disabled 
                  />
                  {isEditing && (
                    <p className="text-xs text-brand-accent mt-2 font-medium">To change your Mohallah, please contact your Aamil Saheb.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Jamaat Name</label>
                  <input type="text" className="input-field bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed" value={user?.jamaatName || ''} disabled />
                </div>

                {isEditing && (
                  <div className="md:col-span-2 pt-6 border-t border-slate-200 flex justify-end space-x-4">
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
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
