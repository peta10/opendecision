import React, { useRef } from 'react';
import { Check } from 'lucide-react';
import { useClickOutside } from '@/ppm-tool/shared/hooks/useClickOutside';

interface StatusDropdownProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  onClose: () => void;
}

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  currentStatus,
  onStatusChange,
  onClose
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useClickOutside(dropdownRef, onClose);
  
  const statuses = [
    { value: 'submitted', label: 'Submitted', color: 'bg-alpine-blue-100 text-alpine-blue-800' },
    { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' }
  ];
  
  return (
    <div className="relative" ref={dropdownRef}>
      <div className="absolute z-10 -mt-2 w-36 bg-white border border-gray-200 rounded-md shadow-lg">
        {statuses.map(status => (
          <button
            key={status.value}
            className={`flex items-center justify-between w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
              status.value === currentStatus ? 'font-medium' : ''
            }`}
            onClick={() => onStatusChange(status.value)}
          >
            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
            {status.value === currentStatus && (
              <Check className="w-4 h-4 text-green-500" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};