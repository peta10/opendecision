import React from 'react';

interface MethodologyTagProps {
  methodology: string;
  className?: string;
}

export const MethodologyTag: React.FC<MethodologyTagProps> = ({ 
  methodology, 
  className = '' 
}) => {
  const getTagStyles = (methodology: string) => {
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border whitespace-nowrap flex-shrink-0 compact-tag ${getTagStyles(methodology)} ${className}`}
    >
      {methodology}
    </span>
  );
}; 