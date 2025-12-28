'use client';

import { useState, useRef, useEffect, FormEvent, KeyboardEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import './landing.css';

// Scout Robot Component
function ScoutRobot({ className = '' }: { className?: string }) {
  return (
    <div className={`robot ${className}`}>
      <div className="antenna-base mat-teal"></div>
      <div className="antenna-ball mat-teal"></div>
      <div className="ear left mat-teal"></div>
      <div className="ear right mat-teal"></div>
      <div className="head mat-white">
        <div className="face-screen">
          <div className="eye left"></div>
          <div className="eye right"></div>
          <div className="smile"></div>
        </div>
      </div>
      <div className="body mat-white"></div>
      <div className="arm-group left">
        <div className="shoulder mat-metal"></div>
        <div className="segment s1 mat-metal"></div>
        <div className="segment s2 mat-metal"></div>
        <div className="segment s3 mat-metal"></div>
        <div className="wrist-cuff mat-teal"></div>
        <div className="claw"></div>
      </div>
      <div className="arm-group right">
        <div className="shoulder mat-metal"></div>
        <div className="segment s1 mat-metal"></div>
        <div className="segment s2 mat-metal"></div>
        <div className="segment s3 mat-metal"></div>
        <div className="wrist-cuff mat-teal"></div>
        <div className="claw"></div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prefetch app page for instant navigation
  useEffect(() => {
    router.prefetch('/app');
  }, [router]);

  // Auto-focus on desktop
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  const handleSubmit = (message: string) => {
    if (isTransitioning) return;
    if (!message.trim() && attachedFiles.length === 0) return;

    setIsTransitioning(true);

    // Store message for the app
    sessionStorage.setItem('scout_initial_message', message);
    if (attachedFiles.length > 0) {
      sessionStorage.setItem('scout_attachments', JSON.stringify(attachedFiles.map(f => f.name)));
    }

    // Phase 1: Add submitting class to chat box
    const chatBox = document.querySelector('.chat-box');
    chatBox?.classList.add('submitting');

    // Phase 2: Hide page content, show transition
    setTimeout(() => {
      document.querySelector('.landing-header')?.classList.add('fade-out');
      document.querySelector('.landing-main')?.classList.add('fade-out');
      document.querySelector('.landing-footer')?.classList.add('fade-out');
      document.querySelector('.robot-container')?.classList.add('fade-out');
      document.querySelector('.transition-overlay')?.classList.add('active');
    }, 200);

    // Phase 3: Fade to white
    setTimeout(() => {
      document.querySelector('.transition-overlay')?.classList.add('fade-out');
    }, 1400);

    // Phase 4: Redirect
    setTimeout(() => {
      router.push('/app');
    }, 1800);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSubmit(inputValue);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(inputValue);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setAttachedFiles(prev => [...prev, ...imageFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (fileName: string) => {
    setAttachedFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const handleQuickAction = (prompt: string) => {
    setInputValue(prompt);
    handleSubmit(prompt);
  };

  return (
    <div className="landing-page">
        {/* Header */}
        <header className="landing-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6EDCD1] to-[#4BBEB3] flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-[#0B1E2D] tracking-tight">OpenDecision</span>
          </div>
          <nav className="header-nav flex items-center gap-8">
            <a href="#" className="text-[15px] font-medium text-[#4A5E6D] hover:text-[#0B1E2D] transition-colors">Features</a>
            <a href="#" className="text-[15px] font-medium text-[#4A5E6D] hover:text-[#0B1E2D] transition-colors">Solutions</a>
            <a href="#" className="text-[15px] font-medium text-[#4A5E6D] hover:text-[#0B1E2D] transition-colors">Pricing</a>
            <a href="#" className="text-[15px] font-medium text-[#4A5E6D] hover:text-[#0B1E2D] transition-colors">Resources</a>
          </nav>
          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 text-[15px] font-semibold text-[#4A5E6D] hover:text-[#0B1E2D] transition-colors">Sign In</button>
            <button className="px-5 py-2.5 rounded-xl text-[15px] font-semibold text-white bg-gradient-to-br from-[#6EDCD1] to-[#4BBEB3] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">Get Started</button>
          </div>
        </header>

        {/* Main */}
        <main className="landing-main">
          <div className="hero">
            <div className="badge">
              <span className="badge-dot"></span>
              The Decision Hub
            </div>

            <h1 className="headline">
              What can Scout help you <span className="highlight">decide?</span>
            </h1>
            <p className="subheadline">
              Compare tools. Make confident decisions.
            </p>

            <form className="chat-container" onSubmit={handleFormSubmit}>
              <div className="chat-box">
                <textarea
                  ref={inputRef}
                  className="chat-input"
                  placeholder="Ask Scout anything about software decisions..."
                  rows={3}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <div className={`attachment-preview ${attachedFiles.length > 0 ? 'has-files' : ''}`}>
                  {attachedFiles.map((file) => (
                    <div key={file.name} className="attachment-item">
                      <span>{file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name}</span>
                      <button type="button" onClick={() => removeFile(file.name)} className="ml-2 text-[#7A8D9C] hover:text-[#0B1E2D]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="chat-toolbar">
                  <div className="flex items-center gap-2">
                    <label className="chat-attach" title="Attach image">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="submit" className="chat-submit">
                      Ask Scout
                      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </form>

            <div className="quick-actions">
              <button className="quick-btn" onClick={() => handleQuickAction('Compare the top project management tools for enterprise')}>
                <svg className="w-[18px] h-[18px] text-[#4BBEB3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
                Compare tools
              </button>
              <button className="quick-btn" onClick={() => handleQuickAction('What CRM is best for a 200-person sales team?')}>
                <svg className="w-[18px] h-[18px] text-[#4BBEB3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
                Get recommendations
              </button>
              <button className="quick-btn" onClick={() => handleQuickAction("How does OpenDecision's evaluation framework work?")}>
                <svg className="w-[18px] h-[18px] text-[#4BBEB3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                Learn more
              </button>
            </div>
          </div>
        </main>

        {/* Robot */}
        <div className="robot-container">
          <div className="robot-glow"></div>
          <div className="robot-shadow"></div>
          <ScoutRobot />
        </div>

        {/* Footer */}
        <footer className="landing-footer">
          <p className="text-sm text-[#7A8D9C]">Powered by <strong className="text-[#3D7A72] font-semibold">Scout AI</strong> · Built for confident decisions</p>
        </footer>

      {/* Transition Overlay */}
      <div className="transition-overlay">
        <div className="transition-scout">
          <ScoutRobot />
        </div>
        <div className="transition-message">
          <h2>Let&apos;s figure this out</h2>
          <p>Scout is preparing your workspace</p>
        </div>
      </div>
    </div>
  );
}
