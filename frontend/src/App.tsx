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
import HelpSupportPage from './pages/HelpSupportPage';
import Layout from './components/Layout';

import { ConfirmProvider } from './contexts/ConfirmContext';

const queryClient = new QueryClient();

// Redirects authenticated users AWAY from public pages (like login) to the dashboard
const PublicOnlyRoute = ({ children }: { children: JSX.Element }) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    return <Navigate to="/home" replace />;
  }
  return children;
};

// Protected Route Component to prevent unauthorized access
const ProtectedRoute = ({ children, requireAdmin = false }: { children: JSX.Element, requireAdmin?: boolean }) => {
  const token = sessionStorage.getItem('token');
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

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
            className: 'font-sans',
            style: { 
              background: '#ffffff', 
              color: '#334155', 
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #f1f5f9',
              fontSize: '14px',
              fontWeight: '600',
              padding: '16px 24px',
              letterSpacing: '0.01em'
            },
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
