import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchableDropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
}

export function SearchableDropdown({ options, value, onChange, placeholder, disabled = false, className = '', menuClassName = '' }: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt: string) => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button 
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-transparent border-none text-sm focus:ring-0 cursor-pointer font-medium text-[#1B1F3B] dark:text-white/90 flex items-center justify-between min-w-[130px] px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        <span className="truncate max-w-[140px] text-left">{value || placeholder}</span>
        <svg className="w-4 h-4 ml-2 opacity-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#1B1F3B] rounded-xl shadow-xl border border-gray-200 dark:border-white/10 z-[100] overflow-hidden ${menuClassName}`}
          >
            <div className="p-2 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-black/20">
              <input 
                type="text" 
                autoFocus
                placeholder="Search..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-[#0E1226] text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#F28C28]/50 text-gray-900 dark:text-white"
              />
            </div>
            <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
              <button
                onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ${value === '' ? 'bg-[#F28C28]/10 text-[#F28C28] font-bold' : 'text-gray-700 dark:text-gray-300'}`}
              >
                {placeholder}
              </button>
              {filteredOptions.map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setIsOpen(false); setSearch(''); }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ${value === opt ? 'bg-[#F28C28]/10 text-[#F28C28] font-bold' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  {opt}
                </button>
              ))}
              {filteredOptions.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-gray-400">No results found</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
