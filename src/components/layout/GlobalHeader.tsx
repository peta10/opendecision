'use client';

import React from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';

export const GlobalHeader: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-[80] bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-14 px-6">
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-gray-700 transition-colors">
            Open Decision
          </Link>
        </div>

        {/* Center: Main Navigation */}
        <nav className="flex items-center space-x-1">
          <Link href="#" className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Spaces
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="#" className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Resources
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="#" className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Contact
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="#" className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Trust
          </Link>
        </nav>

        {/* Right: Profile */}
        <div className="flex items-center space-x-2">
          <Link
            href="#"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span>Profile</span>
            <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-500" />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;
