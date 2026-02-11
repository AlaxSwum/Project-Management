'use client';

import { useState, useRef, useEffect } from 'react';

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

export default function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'Select date',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="form-label">
        {label}
      </label>
      
      <div className="relative mt-1">
        <div
          className="input-field cursor-pointer flex items-center"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={value ? 'text-white' : 'text-[#52525B]'}>
            {value ? formatDate(value) : placeholder}
          </span>
        </div>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-[#1A1A1A] rounded-lg shadow-lg border border-[#2D2D2D] p-4 animate-fade-in">
            <input
              type="date"
              value={value}
              onChange={handleDateChange}
              className="w-full px-4 py-2 border border-[#2D2D2D] rounded-lg focus:border-black focus:ring-2 focus:ring-black focus:ring-offset-2 date-input-no-icon"
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
              }}
            />
            <style>{`
              .date-input-no-icon::-webkit-calendar-picker-indicator {
                display: none !important;
                -webkit-appearance: none;
              }
              .date-input-no-icon::-webkit-inner-spin-button {
                display: none !important;
                -webkit-appearance: none;
              }
              .date-input-no-icon::-webkit-clear-button {
                display: none !important;
                -webkit-appearance: none;
              }
              .date-input-no-icon::-webkit-datetime-edit-text,
              .date-input-no-icon::-webkit-datetime-edit-month-field,
              .date-input-no-icon::-webkit-datetime-edit-day-field,
              .date-input-no-icon::-webkit-datetime-edit-year-field {
                color: #000;
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
} 