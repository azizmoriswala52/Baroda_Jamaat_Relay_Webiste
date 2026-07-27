import React from 'react';
import { motion } from 'framer-motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const PrivacyPolicyPage = () => {
  useDocumentTitle('Privacy Policy');

  const sections = [
    {
      title: '1. Introduction',
      content: 'Welcome to the Baroda Jamaat digital portal. We deeply respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our portal, interact with our services, and tell you about your privacy rights and how the law protects you.'
    },
    {
      title: '2. Data We Collect',
      content: 'We may collect, use, store, and transfer different kinds of personal data about you. This includes Identity Data (such as your name and ITS ID), Contact Data (such as mobile numbers and email addresses), Profile Data (including your family structure and jamaat affiliations), and Technical Data (such as login times, IP addresses, and device usage statistics to improve portal performance).'
    },
    {
      title: '3. How We Use Your Data',
      content: 'We will only use your personal data for the purposes for which we collected it. Primarily, this includes verifying your identity for exclusive jamaat services, managing your community profile securely, processing event RSVPs, communicating important announcements directly to you, and ensuring the technical stability of our spiritual relay streams.'
    },
    {
      title: '4. Data Security',
      content: 'We have put in place robust and appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. Access to your personal data is strictly limited to authorized administrative personnel only, who are bound by strict confidentiality obligations.'
    },
    {
      title: '5. Data Retention',
      content: 'We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or jamaat administrative requirements. Once you are no longer an active member, your data will be securely archived or deleted in accordance with our retention policies.'
    },
    {
      title: '6. Your Legal Rights',
      content: 'Under certain circumstances, you have rights under data protection laws in relation to your personal data. This includes the right to request access to your personal data, request correction of the personal data that we hold about you, and request erasure of your personal data where there is no good reason for us continuing to process it.'
    },
    {
      title: '7. Contact Us',
      content: 'If you have any questions about this privacy policy, our privacy practices, or if you need to update your personal information, please contact the jamaat administration office securely through the portal or by visiting the office in person during operating hours.'
    }
  ];

  return (
    <div className="flex flex-col space-y-6 sm:space-y-8 max-w-4xl mx-auto w-full px-2 sm:px-4 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex justify-between items-center">
          <h3 className="text-xl sm:text-2xl font-bold text-brand-accent dark:text-blue-300 tracking-wide">Privacy Policy</h3>
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

export default PrivacyPolicyPage;
