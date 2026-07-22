import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RelayPage from './pages/RelayPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import HelpSupportPage from './pages/HelpSupportPage';
import Layout from './components/Layout';

import { ConfirmProvider } from './contexts/ConfirmContext';

const queryClient = new QueryClient();

// Redirects authenticated users AWAY from public pages (like login) to the dashboard
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    return <Navigate to="/home" replace />;
  }
  return children;
};

// Protected Route Component to prevent unauthorized access
const ProtectedRoute = ({ children, requireAdmin = false, requireRelayAccess = false }: { children: React.ReactNode, requireAdmin?: boolean, requireRelayAccess?: boolean }) => {
  const token = sessionStorage.getItem('token');
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'ADMIN') {
    return <Navigate to="/home" replace />;
  }

  // requireRelayAccess is no longer used here; access is handled dynamically by the API


  return children;
};

function App() {
  const [isSyncing, setIsSyncing] = React.useState(!sessionStorage.getItem('token'));

  React.useEffect(() => {
    if (!sessionStorage.getItem('token')) {
      localStorage.setItem('getSessionStorage', Date.now().toString());
      
      const timeout = setTimeout(() => {
        setIsSyncing(false);
      }, 200);
      
      return () => clearTimeout(timeout);
    }
  }, []);

  React.useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'getSessionStorage') {
        const token = sessionStorage.getItem('token');
        const user = sessionStorage.getItem('user');
        if (token && user) {
          localStorage.setItem('sessionStorageTransfer', JSON.stringify({ token, user }));
          localStorage.removeItem('sessionStorageTransfer');
        }
      } else if (event.key === 'sessionStorageTransfer' && event.newValue) {
        if (!sessionStorage.getItem('token')) {
          try {
            const data = JSON.parse(event.newValue);
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', data.user);
            setIsSyncing(false);
          } catch (e) {
            console.error("Failed to parse session transfer");
          }
        }
      } else if (event.key === 'logout') {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (isSyncing) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          
          {/* Protected Routes inside Global Layout */}
          <Route path="/home" element={<ProtectedRoute><Layout><HomePage /></Layout></ProtectedRoute>} />
          <Route path="/announcements" element={<ProtectedRoute><Layout><AnnouncementsPage /></Layout></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
          <Route path="/relay" element={<ProtectedRoute><Layout><RelayPage /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><Layout><HelpSupportPage /></Layout></ProtectedRoute>} />
          
          {/* Admin Routes inside Global Layout */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
        <Toaster 
          position="bottom-right" 
          reverseOrder={false}
          toastOptions={{ 
            duration: 4000,
            className: '!bg-white dark:!bg-slate-800 !text-slate-800 dark:!text-slate-100 !shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] !rounded-xl !border !border-slate-100 dark:!border-slate-700 font-sans text-[14px] font-semibold !px-6 !py-4 tracking-[0.01em]',
            style: {},
            success: { 
              iconTheme: { primary: '#0f3c6e', secondary: '#ffffff' },
            },
            error: { 
              iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
            }
          }} 
        />
      </BrowserRouter>
      </ConfirmProvider>
    </QueryClientProvider>
  );
}

export default App;
