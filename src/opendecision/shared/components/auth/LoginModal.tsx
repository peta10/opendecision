'use client';

import React, { useState } from 'react';
import { X, Mail, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useClickOutside } from '@/opendecision/shared/hooks/useClickOutside';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);

  useClickOutside(modalRef, onClose);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div ref={modalRef} className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Sign In Required</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-alpine-blue-500 focus:border-alpine-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    spellCheck="false"
                    autoCapitalize="none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-alpine-blue-500 focus:border-alpine-blue-500 text-gray-900"
                    placeholder="Enter your password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-alpine-blue-500 rounded-lg hover:bg-alpine-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};