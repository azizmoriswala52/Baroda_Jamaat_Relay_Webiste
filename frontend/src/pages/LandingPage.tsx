import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const LandingPage = () => {
  const navigate = useNavigate();
  useDocumentTitle('Welcome');
  const token = sessionStorage.getItem('token');
  
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl w-full text-center"
      >
        <div className="mb-12 flex flex-col items-center">
          <div className="w-48 h-12 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Bismillah_Calligraphy.svg/1024px-Bismillah_Calligraphy.svg.png')] bg-contain bg-center bg-no-repeat mb-4 opacity-80" style={{ filter: 'invert(1) brightness(0.2)' }}></div>
          <h2 className="text-sm font-semibold tracking-[0.15em] text-brand-accent dark:text-blue-300 uppercase">Baroda Jamaat</h2>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-light tracking-tight leading-tight mb-6 text-slate-800 dark:text-slate-100">
          Live Streaming & Recording
        </h1>
        
        <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
          Access the official relay portal for live spiritual sessions and recordings.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {token ? (
            <Link to="/home" className="btn-primary w-full sm:w-auto text-center px-8 py-3 text-lg shadow-md">
              Access Portal
            </Link>
          ) : (
            <Link to="/login" className="btn-primary w-full sm:w-auto text-center px-8 py-3 text-lg shadow-md">
              Sign In to Portal
            </Link>
          )}
        </div>
      </motion.div>
      
      <div className="fixed bottom-6 text-center w-full">
        <p className="text-[11px] text-slate-400">2026 Copyright © Burhani Mohalla - Baroda</p>
      </div>
    </div>
  );
};

export default LandingPage;
