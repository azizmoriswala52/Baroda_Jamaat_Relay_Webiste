import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmOptions {
  type?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmContextType {
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
};

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [modalType, setModalType] = useState<'danger' | 'warning' | 'info'>('warning');
  const [confirmText, setConfirmText] = useState('');
  const [cancelText, setCancelText] = useState('');
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = (msg: string, options?: ConfirmOptions) => {
    setMessage(msg);
    setModalType(options?.type || 'warning');
    setConfirmText(options?.confirmText || (options?.type === 'danger' ? 'Yes, proceed' : 'Confirm'));
    setCancelText(options?.cancelText || 'Cancel');
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  };

  const handleClose = (result: boolean) => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(result);
      setResolvePromise(null);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleClose(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClose(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, resolvePromise]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-brand-accent/30 backdrop-blur-sm"
              onClick={() => handleClose(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="relative bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl shadow-[0_15px_40px_rgba(15,60,110,0.15)] w-full max-w-md overflow-hidden"
            >
              <div className="p-8 relative">
                <div className="flex items-start mb-6">
                  <div className={`flex-shrink-0 mt-0.5
                    ${modalType === 'danger' ? 'text-red-500' : 'text-brand-accent'}`}
                  >
                    <AlertCircle className="w-7 h-7" strokeWidth={2.5} aria-hidden="true" />
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight" id="modal-title">
                      {modalType === 'danger' ? 'Warning' : modalType === 'warning' ? 'Confirm Action' : 'Notice'}
                    </h3>
                    <p className="mt-3 text-base font-medium text-slate-700 leading-relaxed">
                      {message}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    className="btn-secondary font-semibold"
                    onClick={() => handleClose(false)}
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    className={modalType === 'danger' ? 
                      "inline-flex items-center justify-center px-5 py-2.5 bg-red-600 border-2 border-red-600 text-white text-sm font-semibold rounded shadow-sm hover:bg-red-700 hover:border-red-700 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1" 
                      : "btn-primary shadow-md hover:shadow-lg"}
                    onClick={() => handleClose(true)}
                  >
                    {confirmText}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};
