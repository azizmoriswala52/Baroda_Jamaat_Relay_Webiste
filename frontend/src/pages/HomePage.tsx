import React from 'react';
import { motion } from 'framer-motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const HomePage = () => {
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { fullName: 'User', jamaatName: '' };
  useDocumentTitle('Dashboard');

  return (
    <div className="flex flex-col space-y-8">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-lg flex items-center justify-center text-white"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&q=80&w=2000')",
            filter: "brightness(0.3) sepia(0.5) hue-rotate(180deg)" 
          }}
        ></div>
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <div className="w-32 h-10 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Bismillah_Calligraphy.svg/1024px-Bismillah_Calligraphy.svg.png')] bg-contain bg-center bg-no-repeat mx-auto mb-6 opacity-90" style={{ filter: 'invert(1) brightness(2)' }}></div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Ahlan wa Sahlan</h1>
          <p className="text-lg md:text-xl text-slate-200 font-light leading-relaxed">
            Welcome to the official digital portal for Burhani Mohalla, Baroda Jamaat. Stay connected with our community through live spiritual sessions and recordings.
          </p>
        </div>
      </motion.div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100"
        >
          <h2 className="text-2xl font-semibold text-brand-accent mb-4">About Our Jamaat</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Burhani Mohalla, Baroda is a vibrant and deeply rooted community. This portal has been designed to ensure that every member, regardless of where they are, can actively participate in our spiritual and cultural gatherings.
          </p>
          <p className="text-slate-600 leading-relaxed">
            We provide high-quality live relays and an archive of essential sessions. To access these broadcasts, please navigate to the <strong>Dashboard</strong> using the menu on your left.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100"
        >
          <h2 className="text-2xl font-semibold text-brand-accent mb-4">Live Portal Features</h2>
          <ul className="space-y-4">
            <li className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent font-bold text-sm mt-0.5 mr-3 shrink-0">1</div>
              <p className="text-slate-600"><strong>Real-time Streaming:</strong> Watch live relay broadcasts with multi-server support for uninterrupted viewing.</p>
            </li>
            <li className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent font-bold text-sm mt-0.5 mr-3 shrink-0">2</div>
              <p className="text-slate-600"><strong>Announcements:</strong> Receive instant updates and schedules directly within the streaming room.</p>
            </li>
            <li className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent font-bold text-sm mt-0.5 mr-3 shrink-0">3</div>
              <p className="text-slate-600"><strong>Secure Access:</strong> Authenticated access ensures that our community content remains private and secure.</p>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;
