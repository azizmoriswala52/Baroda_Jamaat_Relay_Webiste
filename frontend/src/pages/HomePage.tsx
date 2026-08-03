import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Radio, NotificationBing, ProfileCircle } from 'iconsax-react';

const HomePage = () => {
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { fullName: 'User', jamaatName: '' };
  useDocumentTitle('Home');

  const features = [
    {
      icon: <Radio color="currentColor"  size="32" variant="Linear" className="text-brand-accent dark:text-blue-300" />,
      title: 'Spiritual Connection',
      description: 'Participate in live spiritual sessions and access our archive of essential community recordings.'
    },
    {
      icon: <NotificationBing color="currentColor"  size="32" variant="Linear" className="text-brand-accent dark:text-blue-300" />,
      title: 'Community Updates',
      description: 'Stay informed with the latest news, schedules, and important announcements from the jamaat.'
    },
    {
      icon: <ProfileCircle color="currentColor"  size="32" variant="Linear" className="text-brand-accent dark:text-blue-300" />,
      title: 'Active Engagement',
      description: 'A secure and authenticated space to connect with the community and participate in events.'
    }
  ];

  return (
    <div className="flex flex-col space-y-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-brand-accent dark:text-blue-300 tracking-wide">Home</h3>
        </div>
        <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-700 mt-2"></div>
      </div>

      {/* Welcome Banner */}
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
            Welcome to the official digital portal for Burhani Mohalla, Baroda Jamaat. A unified platform for our community to connect, grow, and thrive together.
          </p>
        </div>
      </motion.div>

      {/* Information & Features */}
      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700"
        >
          <h2 className="text-2xl font-semibold text-brand-accent dark:text-blue-300 mb-4">About Our Portal</h2>
          <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
            <p>
              The Baroda Jamaat digital portal is a dedicated, secure platform meticulously designed to streamline community engagement and keep members seamlessly connected with Burhani Mohalla. As our community grows and evolves, so too do our digital needs. This portal centralizes all essential jamaat services, ensuring that whether you are at home or traveling, you remain closely tied to the heart of our community.
            </p>
            <p>
              <strong>Spiritual Relays & Archives:</strong> We provide high-quality, multi-server redundant streaming for uninterrupted viewing of Majalis, Waaz, and other spiritual gatherings. Additionally, our rich archive allows you to revisit important recordings at your convenience.
            </p>
            <p>
              <strong>Targeted Communications & Administration:</strong> Stay instantly informed with targeted announcements tailored specifically to your demographics and mohalla. The portal also dramatically simplifies our internal community management processes, ensuring smooth, efficient, and highly secure administration for all members.
            </p>
            <p className="pt-4 text-sm text-slate-500 dark:text-slate-400">
              For more information on how we handle your data and your rights as a user, please review our <Link to="/privacy-policy" className="text-brand-accent dark:text-blue-300 hover:underline">Privacy Policy</Link> and <Link to="/terms-and-conditions" className="text-brand-accent dark:text-blue-300 hover:underline">Terms & Conditions</Link>.
            </p>
          </div>
        </motion.div>

        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 mt-8 tracking-tight">Portal Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + (idx * 0.1) }}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-brand-accent/30 dark:hover:border-blue-400/30 transition-colors"
            >
              <div className="mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
