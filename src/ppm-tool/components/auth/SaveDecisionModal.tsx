'use client';

import { useState } from 'react';
import { useSpace } from '@/ppm-tool/shared/contexts/SpaceContext';
import { X, Mail, Check, AlertCircle, Loader2 } from 'lucide-react';

interface SaveDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export function SaveDecisionModal({ isOpen, onClose }: SaveDecisionModalProps) {
  const { authState, convertToPermament, currentSpace } = useSpace();
  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // If user is already logged in (not anonymous), don't show this modal
  if (!authState.isAnonymous) {
    return null;
  }

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      setSubmitState('error');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      setSubmitState('error');
      return;
    }

    setSubmitState('loading');
    setErrorMessage('');

    try {
      await convertToPermament(email);
      setSubmitState('success');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to send magic link'
      );
      setSubmitState('error');
    }
  };

  const handleClose = () => {
    setEmail('');
    setSubmitState('idle');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-sm transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitState === 'success' ? (
          // Success state
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Check your email
            </h2>
            <p className="text-gray-600 mb-6">
              We&apos;ve sent a magic link to <strong>{email}</strong>.
              Click the link in the email to save your decision and access it from any device.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-sm hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        ) : (
          // Form state
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-4 bg-scout/10 rounded-full flex items-center justify-center">
                <Mail className="w-7 h-7 text-scout" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Save your decision
              </h2>
              <p className="text-gray-600 text-sm">
                Enter your email to save{' '}
                <strong>&quot;{currentSpace?.name || 'your decision'}&quot;</strong>{' '}
                and access it from any device.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="save-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email address
                </label>
                <input
                  type="email"
                  id="save-email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (submitState === 'error') {
                      setSubmitState('idle');
                      setErrorMessage('');
                    }
                  }}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-scout/50 focus:border-scout"
                  disabled={submitState === 'loading'}
                />
              </div>

              {/* Error message */}
              {submitState === 'error' && errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-700">{errorMessage}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitState === 'loading'}
                className="w-full py-2.5 bg-scout text-midnight rounded-sm hover:bg-scout/90 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitState === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send magic link'
                )}
              </button>
            </form>

            {/* Footer note */}
            <p className="mt-4 text-xs text-gray-500 text-center">
              We&apos;ll send you a link to save your decision. No password needed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to manage save modal state
 */
export function useSaveDecisionModal() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
