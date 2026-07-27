import React from 'react';
import { motion } from 'framer-motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const TermsConditionsPage = () => {
  useDocumentTitle('Terms & Conditions');

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: 'By accessing and using the Baroda Jamaat digital portal, you accept and agree to be legally bound by the terms and provisions of this agreement. Furthermore, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services, which may be posted and modified from time to time.'
    },
    {
      title: '2. Authorized Access and Accounts',
      content: 'This portal is intended for the exclusive use of registered and verified members of the Baroda Jamaat. You are responsible for maintaining the confidentiality of your login credentials, including your ITS ID and password, and are fully responsible for all activities that occur under your account. You agree to immediately notify the jamaat administration of any unauthorized use of your account.'
    },
    {
      title: '3. Acceptable Use Policy',
      content: 'You agree to use the portal only for lawful, community-oriented purposes. Unauthorized distribution, recording, screen-capturing, or sharing of live relay streams, internal jamaat announcements, event RSVPs, or member data outside of the portal is strictly prohibited and will result in immediate account suspension and potential disciplinary action.'
    },
    {
      title: '4. Spiritual Relays and Media',
      content: 'The spiritual relays, waaz broadcasts, and majalis streams provided on this platform are for your personal, spiritual enrichment only. They are the intellectual property of the respective authorities. Any attempt to download, restream, or broadcast this content on third-party platforms (like YouTube, Facebook, or WhatsApp) without explicit authorization is a severe violation of these terms.'
    },
    {
      title: '5. Content Modification and Availability',
      content: 'The jamaat administration reserves the right to modify, suspend, or discontinue any part of the portal\'s services, forms, or relay streams at any time without prior notice. While we strive to provide consistent, high-quality, and multi-server redundant streaming, we cannot guarantee 100% uninterrupted access due to potential technical limitations.'
    },
    {
      title: '6. User Conduct and Forms',
      content: 'When submitting RSVPs, administrative requests, or communicating with the jamaat through the portal, you agree to provide accurate, current, and complete information. Fraudulent requests or the use of offensive language in communications will not be tolerated.'
    },
    {
      title: '7. Limitation of Liability',
      content: 'The portal and its content are provided on an "as is" and "as available" basis. The jamaat administration makes no representations or warranties of any kind, express or implied, as to the operation of the portal or the information, content, or materials included on it.'
    }
  ];

  return (
    <div className="flex flex-col space-y-6 sm:space-y-8 max-w-4xl mx-auto w-full px-2 sm:px-4 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex justify-between items-center">
          <h3 className="text-xl sm:text-2xl font-bold text-brand-accent dark:text-blue-300 tracking-wide">Terms and Conditions</h3>
        </div>
        <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-700 mt-2"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="space-y-6 sm:space-y-8 text-slate-600 dark:text-slate-300 leading-relaxed text-base sm:text-lg text-left">
          {sections.map((section, idx) => (
            <p key={idx}>
              <strong className="text-slate-800 dark:text-slate-100">{section.title}:</strong> {section.content}
            </p>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default TermsConditionsPage;
