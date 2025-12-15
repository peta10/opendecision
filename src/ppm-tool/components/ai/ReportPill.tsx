'use client';

import React, { forwardRef } from 'react';
import { Send } from 'lucide-react';
import './ReportPill.css';

interface ReportPillProps {
  onClick?: () => void;
  className?: string;
  shortText?: string;
  fullText?: string;
}

export const ReportPill = forwardRef<HTMLButtonElement, ReportPillProps>(
  ({ onClick, className = '', shortText = 'Get Report', fullText = 'Get my Free Comparison Report' }, ref) => {
    return (
      <button
        ref={ref}
        className={`report-pill ${className}`}
        onClick={onClick}
        type="button"
      >
        <span className="report-pill-lighting"></span>

        <span className="report-pill-content">
          <Send className="report-pill-icon" />
          <span className="report-pill-text">
            <span className="hidden sm:inline">{fullText}</span>
            <span className="sm:hidden">{shortText}</span>
          </span>
        </span>
      </button>
    );
  }
);

ReportPill.displayName = 'ReportPill';

export default ReportPill;
