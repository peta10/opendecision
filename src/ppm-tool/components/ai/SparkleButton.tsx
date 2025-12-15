'use client';

import React from 'react';
import './SparkleButton.css';

interface SparkleButtonProps {
  size?: 'small' | 'large';
  onClick?: () => void;
  className?: string;
}

export const SparkleButton: React.FC<SparkleButtonProps> = ({
  size = 'large',
  onClick,
  className = '',
}) => {
  const sizeClass = size === 'small' ? 'sp-small' : 'sp-large';

  return (
    <div className={`sp ${sizeClass} ${className}`} onClick={onClick}>
      <button className="sparkle-button" type="button">
        <span className="spark"></span>
        <span className="backdrop"></span>

        <div className="logo-container">
          <svg
            className="cloud-icon"
            viewBox="0 0 100 80"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="cloud-path"
              d="M20,50 Q10,50 10,40 Q10,25 25,25 Q30,10 50,10 Q70,10 75,25 Q90,25 90,40 Q90,50 80,50"
              fill="none"
              stroke="#ffffff"
              strokeWidth="6"
              strokeLinecap="round"
            ></path>
            <g className="arrows">
              <path
                className="arrow-up"
                d="M40,45 L40,30 L35,35 M40,30 L45,35"
                fill="none"
                stroke="#ffffff"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path
                className="arrow-down"
                d="M60,25 L60,40 L55,35 M60,40 L65,35"
                fill="none"
                stroke="#ffffff"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </g>
          </svg>

          <svg
            className="mountain-logo"
            viewBox="20 0 260 130"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M20,120 L80,40 L140,120 Z" fill="#FFB300"></path>
            <path d="M20,120 L80,40 L95,120 Z" fill="#D87D00"></path>
            <path d="M105,120 L175,10 L245,120 Z" fill="#00E5FF"></path>
            <path d="M105,120 L175,10 L190,120 Z" fill="#0091EA"></path>
            <path d="M210,120 L245,70 L280,120 Z" fill="#00FF66"></path>
            <path d="M210,120 L245,70 L255,120 Z" fill="#00C853"></path>
          </svg>
        </div>

        <svg
          className="sparkle"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z"
            fill="white"
            stroke="none"
          ></path>
        </svg>
      </button>

      <span aria-hidden="true" className="particle-pen">
        <svg
          className="particle"
          style={{
            '--x': 50,
            '--y': 20,
            '--duration': 2,
            '--delay': 0.1,
            '--origin-x': '50%',
            '--origin-y': '80%',
          } as React.CSSProperties}
          viewBox="0 0 15 15"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M7.5 1L8.5 4L11.5 5L8.5 6L7.5 9L6.5 6L3.5 5L6.5 4L7.5 1Z"></path>
        </svg>
      </span>
    </div>
  );
};

export default SparkleButton;
