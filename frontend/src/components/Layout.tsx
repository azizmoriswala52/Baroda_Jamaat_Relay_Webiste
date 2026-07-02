import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Home, Video, Settings, LogOut, User, ShieldAlert, LifeBuoy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiClient } from '../api/apiClient';

interface LayoutProps {
  children: React.ReactNode;
}

const BOHRA_MONTHS = [
  "Moharram al-Haram", "Safar al-Muzaffar", "Rabi ul Awwal", "Rabi ul Akhar", 
  "Jumadil Awwal", "Jumadil Akhar", "Rajab al-Asab", "Shaban al-Karim", 
  "Ramadan al-Moazzam", "Shawwal al-Mukarram", "Zilqad al-Haram", "Zilhaj al-Haram"
];

const getBohraDate = () => {
  try {
    const date = new Date();
    // The user explicitly stated they are observing dates 1 day ahead of the standard tabular calculation
    date.setDate(date.getDate() + 1);
    
    // Offset for timezones to ensure we get the local day correctly
    const unixEpoch = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const daysSinceUnix = Math.floor(unixEpoch / (1000 * 60 * 60 * 24));
    
    // Misri Epoch (July 15, 622 CE) is exactly 492148 days before Unix Epoch
    const daysSinceMisriEpoch = daysSinceUnix + 492148;
    
    // 30-year cycle has 10631 days
    const cycles = Math.floor(daysSinceMisriEpoch / 10631);
    const daysInCurrentCycle = daysSinceMisriEpoch % 10631;
    
    let yearInCycle = 0;
    let remainingDays = daysInCurrentCycle;
    
    // Fatimid Leap years in 30-year cycle
    const isLeapYear = (y: number) => [2, 5, 8, 10, 13, 16, 19, 21, 24, 27, 29].includes(y);
    
    for (let i = 1; i <= 30; i++) {
      const daysInYear = isLeapYear(i) ? 355 : 354;
      if (remainingDays < daysInYear) {
        yearInCycle = i;
        break;
      }
      remainingDays -= daysInYear;
    }
    
    const hijriYear = cycles * 30 + yearInCycle;
    
    let month = 0;
    for (let i = 1; i <= 12; i++) {
      let daysInMonth = (i % 2 !== 0) ? 30 : 29;
      if (i === 12 && isLeapYear(yearInCycle)) {
        daysInMonth = 30;
      }
      
      if (remainingDays < daysInMonth) {
        month = i;
        break;
      }
      remainingDays -= daysInMonth;
    }
    
    const day = remainingDays + 1;
    return `${day} ${BOHRA_MONTHS[month - 1]} ${hijriYear}H`;
  } catch (e) {
    return '';
  }
};

const getEnglishDate = () => {
  return new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const displayName = user?.role === 'ADMIN' ? `${user?.fullName || 'User'} (Admin)` : user?.fullName || 'User';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: supportQueries } = useQuery({
    queryKey: ['adminSupportQueries'],
    queryFn: () => apiClient('/support'),
    refetchInterval: 10000,
    enabled: user?.role === 'ADMIN'
  });

  const { data: loginIssues } = useQuery({
    queryKey: ['adminLoginIssues'],
    queryFn: () => apiClient('/login-issues'),
    refetchInterval: 10000,
    enabled: user?.role === 'ADMIN'
  });

  const [previousQueryCount, setPreviousQueryCount] = useState<number | null>(null);
  const [previousLoginIssueCount, setPreviousLoginIssueCount] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role === 'ADMIN' && supportQueries) {
      if (previousQueryCount !== null && supportQueries.length > previousQueryCount) {
        toast('Someone needs support! Please check the support submissions.', {
          icon: '🚨',
          duration: 8000,
          style: {
            background: '#fff',
            color: '#dc2626',
            fontWeight: 'bold',
            border: '1px solid #dc2626'
          }
        });
      }
      setPreviousQueryCount(supportQueries.length);
    }
  }, [supportQueries, previousQueryCount, user?.role]);

  useEffect(() => {
    if (user?.role === 'ADMIN' && loginIssues) {
      if (previousLoginIssueCount !== null && loginIssues.length > previousLoginIssueCount) {
        toast('A user reported a login issue! Please check the Login Issues tab.', {
          icon: '🔑',
          duration: 8000,
          style: {
            background: '#fff',
            color: '#d97706',
            fontWeight: 'bold',
            border: '1px solid #d97706'
          }
        });
      }
      setPreviousLoginIssueCount(loginIssues.length);
    }
  }, [loginIssues, previousLoginIssueCount, user?.role]);

  useEffect(() => {
    if (user) {
      const pingInterval = setInterval(() => {
        apiClient('/auth/ping', { method: 'POST' }).catch((err) => {
          if (err.message === 'FORCE_LOGOUT') {
            clearInterval(pingInterval);
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            toast.error('Your session has been terminated by an administrator.', {
              duration: 8000,
              icon: '🚨'
            });
            navigate('/login');
          }
        });
      }, 5000);
      return () => clearInterval(pingInterval);
    }
  }, [user]);

  const handleLogoutWithConfirm = async () => {
    if (window.confirm("Do you want to logout?")) {
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

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="h-screen overflow-hidden bg-brand-bg text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-brand-accent shadow-md flex justify-between items-center px-4 md:px-6 py-5 sm:py-4 z-50 shrink-0 relative overflow-hidden">
        
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

        <div className="flex items-center space-x-1 sm:space-x-2 flex-1 relative z-10">
          <button 
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="text-white hover:text-slate-200 transition-colors hidden md:block focus:outline-none p-1"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6 scale-x-[1.2]" />
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white hover:text-slate-200 transition-colors md:hidden focus:outline-none p-1"
          >
            {isMobileMenuOpen ? (
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 scale-x-[1.2]" />
            )}
          </button>
          <Link to="/home" className="flex items-center group ml-1 sm:ml-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Bismillah_Calligraphy.svg/1024px-Bismillah_Calligraphy.svg.png')] bg-contain bg-center bg-no-repeat opacity-90 mr-1.5 sm:mr-2 group-hover:opacity-100 transition-opacity" style={{ filter: 'brightness(0) invert(1)' }}></div>
            <h1 className="text-base sm:text-lg font-medium tracking-widest text-white uppercase whitespace-nowrap">Baroda Jamaat</h1>
          </Link>
        </div>

        <div className="flex items-center justify-end space-x-2 sm:space-x-4 shrink-0 relative z-10">
          <div className="relative">
            <div className="flex items-center space-x-2 group">
              <span className="text-xs sm:text-sm text-white/90 font-medium hidden md:flex items-center">
                {getBohraDate()} ({getEnglishDate()}) 
                <div className="w-[1px] h-5 bg-white/30 mx-3"></div>
              </span>
              <span className="text-sm text-white font-medium group-hover:text-slate-200 transition-colors max-w-[120px] sm:max-w-[200px] truncate block">{displayName}</span>
              <div className="w-8 h-8 shrink-0 rounded-full bg-white text-brand-accent flex items-center justify-center font-bold shadow-sm">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Collapsible Left Sidebar */}
        <motion.aside 
          animate={{ width: isSidebarExpanded ? 256 : 80 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="bg-[#f0f2f5] border-r border-slate-200 hidden md:flex flex-col py-4 h-full shrink-0 z-40 overflow-hidden"
        >
          <nav className="flex flex-col space-y-1 px-3 mt-2 overflow-hidden">
            <Link 
              to="/home" 
              title="Home"
              className={`flex items-center py-3 px-4 rounded-lg text-sm font-semibold transition-colors ${isActive('/home') ? 'bg-[#e2e8f0] text-brand-accent' : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'} whitespace-nowrap`}
            >
              <Home className="w-5 h-5 shrink-0" />
              <motion.span 
                animate={{ width: isSidebarExpanded ? "auto" : 0, opacity: isSidebarExpanded ? 1 : 0, marginLeft: isSidebarExpanded ? 16 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                Home
              </motion.span>
            </Link>
            
            <Link 
              to="/dashboard" 
              title="Relay Dashboard"
              className={`flex items-center py-3 px-4 rounded-lg text-sm font-semibold transition-colors ${isActive('/dashboard') || isActive('/relay') ? 'bg-[#e2e8f0] text-brand-accent' : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'} whitespace-nowrap`}
            >
              <Video className="w-5 h-5 shrink-0" />
              <motion.span 
                animate={{ width: isSidebarExpanded ? "auto" : 0, opacity: isSidebarExpanded ? 1 : 0, marginLeft: isSidebarExpanded ? 16 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                Relay Dashboard
              </motion.span>
            </Link>

            {user?.role === 'ADMIN' && (
              <Link 
                to="/admin" 
                title="Admin Dashboard"
                className={`flex items-center py-3 px-4 rounded-lg text-sm font-semibold transition-colors ${isActive('/admin') ? 'bg-[#e2e8f0] text-brand-accent' : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'} whitespace-nowrap`}
              >
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <motion.span 
                  animate={{ width: isSidebarExpanded ? "auto" : 0, opacity: isSidebarExpanded ? 1 : 0, marginLeft: isSidebarExpanded ? 16 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  Admin Dashboard
                </motion.span>
              </Link>
            )}

            <Link 
              to="/profile" 
              title="Settings"
              className={`flex items-center py-3 px-4 rounded-lg text-sm font-semibold transition-colors ${isActive('/profile') ? 'bg-[#e2e8f0] text-brand-accent' : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'} whitespace-nowrap`}
            >
              <Settings className="w-5 h-5 shrink-0" />
              <motion.span 
                animate={{ width: isSidebarExpanded ? "auto" : 0, opacity: isSidebarExpanded ? 1 : 0, marginLeft: isSidebarExpanded ? 16 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                Settings
              </motion.span>
            </Link>

            <Link 
              to="/support" 
              title="Help & Support"
              className={`flex items-center py-3 px-4 rounded-lg text-sm font-semibold transition-colors ${isActive('/support') ? 'bg-[#e2e8f0] text-brand-accent' : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'} whitespace-nowrap`}
            >
              <LifeBuoy className="w-5 h-5 shrink-0" />
              <motion.span 
                animate={{ width: isSidebarExpanded ? "auto" : 0, opacity: isSidebarExpanded ? 1 : 0, marginLeft: isSidebarExpanded ? 16 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                Help & Support
              </motion.span>
            </Link>
            
            <div className="mt-8 pt-4 border-t border-slate-200/60 flex flex-col space-y-1">
              <button 
                onClick={handleLogoutWithConfirm} 
                title="Logout"
                className={`flex items-center py-3 px-4 rounded-lg text-sm font-semibold transition-colors text-red-600 hover:bg-red-50 w-full whitespace-nowrap`}
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <motion.span 
                  animate={{ width: isSidebarExpanded ? "auto" : 0, opacity: isSidebarExpanded ? 1 : 0, marginLeft: isSidebarExpanded ? 16 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  Logout
                </motion.span>
              </button>
            </div>
          </nav>
        </motion.aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative" id="main-scroll-container">
          <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col min-h-min">
            {children}
          </div>
          
          {/* Global Footer */}
          <footer className="mt-auto border-t border-slate-200 py-6 bg-[#f8f9fa]">
            <div className="max-w-[1600px] mx-auto px-6 text-center text-slate-500 text-xs">
              <p>2026 Copyright © Burhani Mohalla - Baroda. All rights reserved.</p>
            </div>
          </footer>
        </main>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[64px] bottom-0 z-40 bg-brand-bg flex flex-col md:hidden overflow-y-auto"
          >
            
            <nav className="flex flex-col space-y-2 p-6 mt-4">
              <Link to="/home" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center p-4 rounded-xl text-base font-semibold transition-colors ${isActive('/home') ? 'bg-[#e2e8f0] text-brand-accent' : 'text-slate-600'}`}>
                <Home className="w-6 h-6 mr-4" /> Home
              </Link>
              <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center p-4 rounded-xl text-base font-semibold transition-colors ${isActive('/dashboard') || isActive('/relay') ? 'bg-[#e2e8f0] text-brand-accent' : 'text-slate-600'}`}>
                <Video className="w-6 h-6 mr-4" /> Relay Dashboard
              </Link>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center p-4 rounded-xl text-base font-semibold transition-colors ${isActive('/admin') ? 'bg-[#e2e8f0] text-brand-accent' : 'text-slate-600'}`}>
                  <ShieldAlert className="w-6 h-6 mr-4" /> Admin Dashboard
                </Link>
              )}
              <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center p-4 rounded-xl text-base font-semibold transition-colors ${isActive('/profile') ? 'bg-[#e2e8f0] text-brand-accent' : 'text-slate-600'}`}>
                <Settings className="w-6 h-6 mr-4" /> Settings
              </Link>
              <Link to="/support" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center p-4 rounded-xl text-base font-semibold transition-colors ${isActive('/support') ? 'bg-[#e2e8f0] text-brand-accent' : 'text-slate-600'}`}>
                <LifeBuoy className="w-6 h-6 mr-4" /> Help & Support
              </Link>
              <button onClick={() => { setIsMobileMenuOpen(false); handleLogoutWithConfirm(); }} className="flex items-center p-4 rounded-xl text-base font-semibold transition-colors text-red-600 mt-8 border border-red-100 bg-red-50">
                <LogOut className="w-6 h-6 mr-4" /> Logout
              </button>

              <div className="mt-8 text-left px-4">
                <p className="text-sm font-bold text-slate-800">
                  {getBohraDate()} <span className="font-medium text-slate-500 text-xs">({getEnglishDate()})</span>
                </p>
              </div>
            </nav>

            <div className="mt-auto p-6 text-center mb-4">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                2026 Copyright © Burhani Mohalla - Baroda. All rights reserved.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
