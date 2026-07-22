import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  label: string;
  value: string;
}

interface MultiSelectDropdownProps {
  options: Option[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ options, values, onChange, placeholder = 'Select options', className = '', disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync highlighted item when opened
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const button = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (button) {
        button.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const toggleOption = (value: string) => {
    if (value === 'All') {
      if (!values.includes('All')) {
        onChange(['All']);
      } else {
        onChange([]);
      }
      return;
    }

    if (values.includes(value)) {
      onChange(values.filter(v => v !== value));
    } else {
      const newValues = values.filter(v => v !== 'All');
      onChange([...newValues, value]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          toggleOption(options[highlightedIndex].value);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      default:
        // Quick select by typing
        if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
          const char = e.key.toLowerCase();
          const startIndex = highlightedIndex + 1 >= options.length ? 0 : highlightedIndex + 1;
          
          let nextIndex = options.findIndex((opt, i) => i >= startIndex && opt.label.toLowerCase().startsWith(char));
          if (nextIndex === -1) {
            nextIndex = options.findIndex((opt) => opt.label.toLowerCase().startsWith(char));
          }
          
          if (nextIndex !== -1) {
            setHighlightedIndex(nextIndex);
          }
        }
        break;
    }
  };

  const selectedLabels = options
    .filter(opt => values.includes(opt.value))
    .map(opt => opt.label);

  const displayValue = selectedLabels.length > 0 
    ? (selectedLabels.length <= 2 ? selectedLabels.join(', ') : `${selectedLabels.length} selected`)
    : placeholder;

  return (
    <div className={`relative ${className} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} ref={dropdownRef} onKeyDown={disabled ? undefined : handleKeyDown}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between input-field bg-white dark:bg-slate-800 text-left focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all duration-200 ${disabled ? 'cursor-not-allowed bg-slate-50 dark:bg-slate-900/50' : ''}`}
      >
        <span className={values.length > 0 ? 'text-slate-900 dark:text-slate-50 truncate pr-2' : 'text-slate-400 truncate pr-2'}>
          {displayValue}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
          <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ transformOrigin: 'top' }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden py-1"
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar" ref={listboxRef}>
              {options.map((option, index) => {
                const isSelected = values.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      toggleOption(option.value);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors duration-150 ${
                      highlightedIndex === index
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 flex-shrink-0 transition-colors ${
                      isSelected 
                        ? 'bg-brand-accent border-brand-accent text-white' 
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiSelectDropdown;
