import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, ArrowLeft } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: ''
  });
  const [successMsg, setSuccessMsg] = useState('');

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => apiClient('/users/profile'),
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        mobile: user.mobile || '',
        password: '' // Don't populate password
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
      localStorage.setItem('user', JSON.stringify(data.user));
      setTimeout(() => setSuccessMsg(''), 3000);
      setFormData(prev => ({ ...prev, password: '' })); // Clear password field after save
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

  const handleLogoutWithConfirm = () => {
    if (window.confirm("Do you want to logout?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-brand-bg">Loading profile...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-brand-bg text-red-500">Error loading profile. Please login again.</div>;
  }

  const displayName = user?.role === 'ADMIN' ? `${user.fullName} (Admin)` : user?.fullName;

  return (
    <>
      <div className="max-w-5xl mx-auto w-full">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="flex flex-col space-y-1 sticky top-0 self-start">
              <a href="#" className="px-4 py-2.5 rounded-md bg-white border border-slate-200 text-brand-accent text-sm font-medium shadow-sm">
                General
              </a>
              <div className="my-4 border-t border-slate-200"></div>
              <button 
                onClick={handleLogoutWithConfirm}
                className="px-4 py-2.5 rounded-md text-red-600 hover:bg-red-50 text-sm font-medium transition-colors text-left flex items-center w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
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
              <div className="flex items-center space-x-6 pb-8 border-b border-slate-200">
                <div className="w-20 h-20 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-1 text-slate-800">{user?.fullName}</h2>
                  <p className="text-slate-500 text-sm">ITS: {user?.itsId}</p>
                </div>
              </div>

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Full Name</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="input-field" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Mobile Number</label>
                  <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} className="input-field" required />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Jamaat Name</label>
                  <input type="text" className="input-field bg-slate-50 border-slate-200 text-slate-500" value={user?.jamaatName || ''} readOnly />
                </div>

                <div className="md:col-span-2 pt-6 border-t border-slate-200 flex justify-end">
                  <button type="submit" disabled={updateProfileMutation.isPending} className="btn-primary">
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
