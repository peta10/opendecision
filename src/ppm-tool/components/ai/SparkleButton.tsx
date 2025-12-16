'use client';

import React from 'react';
import Image from 'next/image';
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
  const imageSize = size === 'small' ? 32 : 80;

  return (
    <div className={`sp ${sizeClass} ${className}`} onClick={onClick}>
      <div className="compass-logo-wrapper">
        <Image
          src="/scout.ai.png"
          alt="Scout AI"
          width={imageSize}
          height={imageSize}
          className="compass-logo"
          priority
        />
      </div>
    </div>
  );
};

export default SparkleButton;
