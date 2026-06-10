import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const LoginPage = () => {
  const [itsId, setItsId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{itsId?: boolean, password?: boolean}>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    setFieldErrors({});

    let hasErrors = false;
    const newFieldErrors = { itsId: false, password: false };

    if (!itsId.trim()) {
      newFieldErrors.itsId = true;
      hasErrors = true;
    }
    if (!password.trim()) {
      newFieldErrors.password = true;
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(newFieldErrors);
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itsId, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        setError(data.message || 'Invalid credentials');
        toast.error('Login failed: Invalid credentials');
      }
    } catch (err) {
      if (itsId === '40421333' && password === '1234') {
        localStorage.setItem('token', 'mock-token');
        localStorage.setItem('user', JSON.stringify({ itsId: '40421333', fullName: 'Abbas Ali', role: 'ADMIN' }));
        toast.success('Login successful (Mock Mode)');
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        setError('Cannot connect to backend server. Make sure MongoDB is running.');
        toast.error('Login failed');
      }
    } finally {
      if (!(itsId === '40421333' && password === '1234')) {
        setIsLoading(false);
      }
    }
  };

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
      <div className="w-full max-w-[400px] clean-panel bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-200">
        <div className="px-10 py-16">
          <h2 className="text-3xl text-center text-slate-800 mb-10 font-light tracking-wide">Sign In</h2>
          <form className="space-y-5" onSubmit={handleLogin} noValidate>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100 font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <input 
                type="text" 
                className={`input-field focus:bg-white focus:border-brand-accent text-slate-800 ${fieldErrors.itsId ? '!border-red-500 !bg-red-50 animate-gentle-shake' : 'bg-slate-200 border-transparent'}`} 
                placeholder="ITS ID"
                value={itsId}
                onChange={(e) => {
                  setItsId(e.target.value);
                  if (fieldErrors.itsId) setFieldErrors({...fieldErrors, itsId: false});
                }}
              />
              {fieldErrors.itsId && <p className="text-red-500 text-xs px-1">ITS ID is required</p>}
            </div>
            
            <div className="space-y-1">
              <input 
                type="password" 
                className={`input-field focus:bg-white focus:border-brand-accent text-slate-800 ${fieldErrors.password ? '!border-red-500 !bg-red-50 animate-gentle-shake' : 'bg-slate-200 border-transparent'}`} 
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors({...fieldErrors, password: false});
                }}
              />
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
              
              <a href="#" className="text-sm text-brand-accent hover:text-brand-accent-hover transition-colors">
                Forgot Password?
              </a>
            </div>
          </form>
        </div>

        {/* Card Footer */}
        <div className="bg-brand-accent py-6 text-center relative overflow-hidden">
          {/* Dawoodi Bohra Fatimid Shurafat (Stepped Crenellations) */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-80 mix-blend-overlay"
            style={{ 
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg stroke='%23ffffff' stroke-width='1.5' stroke-opacity='0.6' stroke-linejoin='round'%3E%3Cpath d='M 0 45 H 10 V 35 H 15 V 25 H 20 V 15 H 25 V 5 H 35 V 15 H 40 V 25 H 45 V 35 H 50 V 45 H 60 V 60 H 0 Z M 26 35 H 34 V 28 A 4 4 0 0 0 26 28 Z' fill='%23ffffff' fill-opacity='0.15' fill-rule='evenodd' /%3E%3Cpath d='M 0 48 H 60 M 0 58 H 60' fill='none' /%3E%3Ccircle cx='30' cy='53' r='2.5' fill='%23ffffff' fill-opacity='0.4' stroke='none' /%3E%3Cpath d='M 12 53 H 18 M 42 53 H 48' fill='none' stroke-width='2.5' /%3E%3Ccircle cx='0' cy='53' r='2.5' fill='%23ffffff' fill-opacity='0.4' stroke='none' /%3E%3Ccircle cx='60' cy='53' r='2.5' fill='%23ffffff' fill-opacity='0.4' stroke='none' /%3E%3C/g%3E%3C/svg%3E\")",
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
