'use client';

import React, { forwardRef } from 'react';
import './ModernPill.css';

type PillVariant = 'blue' | 'green' | 'gray';
type PillSize = 'sm' | 'md' | 'lg';

interface ModernPillProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: PillVariant;
  size?: PillSize;
  disabled?: boolean;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
}

export const ModernPill = forwardRef<HTMLButtonElement, ModernPillProps>(
  ({
    children,
    onClick,
    className = '',
    variant = 'blue',
    size = 'md',
    disabled = false,
    type = 'button',
    fullWidth = false
  }, ref) => {
    return (
      <button
        ref={ref}
        className={`modern-pill modern-pill--${variant} modern-pill--${size} ${fullWidth ? 'modern-pill--full' : ''} ${className}`}
        onClick={onClick}
        type={type}
        disabled={disabled}
      >
        <span className="modern-pill__lighting"></span>
        <span className="modern-pill__content">
          {children}
        </span>
      </button>
    );
  }
);

ModernPill.displayName = 'ModernPill';

export default ModernPill;
