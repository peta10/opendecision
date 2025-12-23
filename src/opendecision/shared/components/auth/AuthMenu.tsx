'use client';

import React, { useState } from 'react';
import { LogIn, LogOut, UserPlus, Settings, ChevronDown, Mail, Lock, Chrome } from 'lucide-react';
import { useClickOutside } from '@/opendecision/shared/hooks/useClickOutside';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthMenuProps {
  user: User | null;
  onSignOut: () => void;
}

export const AuthMenu: React.FC<AuthMenuProps> = ({ user, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setIsOpen(false));

  const validatePassword = (pass: string) => {
    return pass.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!supabase) {
      setError('Authentication service not available');
      setIsLoading(false);
      return;
    }

    try {
      if (showSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-alpine-blue-600 hover:bg-alpine-blue-700 transition-colors text-sm shadow-sm"
        >
          <span className="text-white">{user.email}</span>
          <ChevronDown className="w-3 h-3 text-alpine-blue-200" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
            <button
              onClick={onSignOut}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-alpine-blue-600 hover:bg-alpine-blue-700 transition-colors text-sm shadow-sm"
      >
        <LogIn className="w-4 h-4 text-alpine-blue-200" />
        <span className="text-white">Sign In</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {showSignUp ? 'Create Account' : 'Welcome Back'}
              </h3>
              <button
                onClick={() => setShowSignUp(!showSignUp)}
                className="text-sm text-alpine-blue-500 hover:text-alpine-blue-700 flex items-center"
              >
                {showSignUp ? (
                  <>
                    <LogIn className="w-4 h-4 mr-1" />
                    Sign In
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Sign Up
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-alpine-blue-500 focus:border-alpine-blue-500 text-gray-900"
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
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-alpine-blue-500 focus:border-alpine-blue-500 text-gray-900 ${
                      passwordFocused && !validatePassword(password) ? 'border-red-300' : ''
                    }`}
                    placeholder="Enter your password"
                  />
                </div>
                {passwordFocused && !validatePassword(password) && (
                  <p className="mt-1 text-xs text-red-500">
                    Password must be at least 6 characters long
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !validatePassword(password)}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-alpine-blue-500 rounded-lg hover:bg-alpine-blue-600 disabled:opacity-50"
              >
                {isLoading ? 'Please wait...' : (showSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};