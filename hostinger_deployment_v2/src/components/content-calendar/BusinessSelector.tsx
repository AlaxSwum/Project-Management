'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  ChevronDownIcon, 
  PlusIcon, 
  BuildingOfficeIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';
import { Business } from '@/types/content-calendar';

interface BusinessSelectorProps {
  businesses: Business[];
  selectedBusiness: Business | null;
  onSelect: (business: Business) => void;
  onCreateNew: () => void;
  isLoading?: boolean;
}

export default function BusinessSelector({
  businesses,
  selectedBusiness,
  onSelect,
  onCreateNew,
  isLoading
}: BusinessSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="h-10 w-48 bg-[#2D2D2D] animate-pulse rounded-lg" />
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg hover:bg-[#141414] transition-colors min-w-[200px]"
      >
        {selectedBusiness ? (
          <>
            {selectedBusiness.logo_url ? (
              <img 
                src={selectedBusiness.logo_url} 
                alt={selectedBusiness.name}
                className="w-6 h-6 rounded object-cover"
              />
            ) : (
              <div 
                className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: '#3B82F6' }}
              >
                {selectedBusiness.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="flex-1 text-left font-medium text-gray-900 truncate">
              {selectedBusiness.name}
            </span>
          </>
        ) : (
          <>
            <BuildingOfficeIcon className="w-5 h-5 text-[#52525B]" />
            <span className="flex-1 text-left text-[#71717A]">Select Business</span>
          </>
        )}
        <ChevronDownIcon 
          className={`w-5 h-5 text-[#52525B] transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Business List */}
          <div className="max-h-60 overflow-y-auto">
            {businesses.length === 0 ? (
              <div className="px-4 py-6 text-center text-[#71717A]">
                <BuildingOfficeIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No businesses yet</p>
              </div>
            ) : (
              businesses.map(business => (
                <button
                  key={business.id}
                  onClick={() => {
                    onSelect(business);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#141414] transition-colors ${
                    selectedBusiness?.id === business.id ? 'bg-blue-50' : ''
                  }`}
                >
                  {business.logo_url ? (
                    <img 
                      src={business.logo_url} 
                      alt={business.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <div 
                      className="w-8 h-8 rounded flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: '#3B82F6' }}
                    >
                      {business.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">{business.name}</p>
                    {business.industry && (
                      <p className="text-xs text-[#71717A]">{business.industry}</p>
                    )}
                  </div>
                  {selectedBusiness?.id === business.id && (
                    <CheckIcon className="w-5 h-5 text-blue-600" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Create New */}
          <div className="border-t border-[#2D2D2D]">
            <button
              onClick={() => {
                onCreateNew();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="font-medium">Create New Business</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Create Business Modal
interface CreateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string; industry?: string }) => void;
  isSubmitting: boolean;
}

export function CreateBusinessModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting
}: CreateBusinessModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      industry: industry.trim() || undefined
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Business</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Acme Corp"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of this business..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select industry...</option>
              <option value="Technology">Technology</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Education">Education</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Food & Beverage">Food & Beverage</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Travel">Travel</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-[#141414]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Business'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
