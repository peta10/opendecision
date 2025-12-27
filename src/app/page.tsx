'use client';

import { useState, useRef, useEffect, FormEvent, KeyboardEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

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
    <>
      <style jsx global>{`
        /* Landing Page Specific Styles */
        .landing-page {
          --scout: #6EDCD1;
          --scout-light: #8FE8DF;
          --scout-dark: #4BBEB3;
          --scout-deep: #2D8A80;
          --scout-dim: rgba(110, 220, 209, 0.12);
          --scout-glow: rgba(110, 220, 209, 0.5);
          --midnight: #0B1E2D;
          --mint: #D4E8E6;
          --summit: #3D7A72;
          --text-primary: #0B1E2D;
          --text-secondary: #4A5E6D;
          --text-muted: #7A8D9C;
          --border: rgba(110, 220, 209, 0.3);
          --border-subtle: rgba(11, 30, 45, 0.08);
          --mat-white: #F8FAFA;
          --mat-white-shadow: #C8D4D2;
          --mat-teal: #6EDCD1;
          --mat-teal-shadow: #3BA99E;
          --mat-metal-light: #E6EDEC;
          --mat-metal-mid: #9AB0AD;
          --mat-metal-dark: #5D7573;
          --screen-bg: #0B1E2D;
          --glow-white: #FFFFFF;
          --glow-teal: #6EDCD1;
        }

        .landing-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #FAFCFC 0%, #F0F7F6 50%, #E8F4F3 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Fade out class */
        .fade-out {
          opacity: 0 !important;
          transition: opacity 0.3s ease !important;
        }

        /* Header */
        .landing-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 16px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-subtle);
          transition: opacity 0.3s ease;
        }

        /* Main content */
        .landing-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 120px 24px 80px;
          position: relative;
          overflow: hidden;
          min-height: 100vh;
          transition: opacity 0.3s ease;
        }

        /* Ambient orbs */
        .landing-main::before {
          content: '';
          position: absolute;
          top: 48%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 900px;
          height: 700px;
          background: radial-gradient(circle at 50% 50%, rgba(110, 220, 209, 0.35) 0%, rgba(110, 220, 209, 0.2) 25%, rgba(110, 220, 209, 0.08) 50%, transparent 70%);
          pointer-events: none;
          z-index: 1;
        }

        .landing-main::after {
          content: '';
          position: absolute;
          top: 55%;
          left: 65%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 500px;
          background: radial-gradient(ellipse at center, rgba(212, 232, 230, 0.3) 0%, rgba(110, 220, 209, 0.1) 40%, transparent 70%);
          pointer-events: none;
          z-index: 1;
        }

        .hero {
          text-align: center;
          max-width: 720px;
          width: 100%;
          position: relative;
          z-index: 10;
        }

        /* Badge */
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--scout-dim);
          border: 1px solid var(--border);
          border-radius: 100px;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--summit);
          margin-bottom: 24px;
        }

        .badge-dot {
          width: 8px;
          height: 8px;
          background: var(--scout);
          border-radius: 50%;
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }

        /* Headline */
        .headline {
          font-size: clamp(2rem, 5vw, 3.25rem);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.035em;
          background: linear-gradient(180deg, var(--text-primary) 0%, #2A3F4D 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 20px;
        }

        .headline .highlight {
          background: linear-gradient(135deg, var(--scout-dark) 0%, var(--scout-deep) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.04em;
        }

        .subheadline {
          font-size: 1.1875rem;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-bottom: 40px;
        }

        /* Chat box - Glassmorphism */
        .chat-container {
          width: 100%;
          max-width: 720px;
          margin: 0 auto 32px;
        }

        .chat-box {
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1.5px solid rgba(255, 255, 255, 0.6);
          border-radius: 24px;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 12px 24px rgba(110, 220, 209, 0.12), 0 24px 48px rgba(110, 220, 209, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.8);
          overflow: hidden;
        }

        .chat-box:focus-within {
          background: rgba(255, 255, 255, 0.85);
          border-color: rgba(110, 220, 209, 0.5);
          box-shadow: 0 0 0 4px rgba(110, 220, 209, 0.15), 0 0 40px rgba(110, 220, 209, 0.25), 0 8px 16px rgba(110, 220, 209, 0.15), 0 24px 48px rgba(110, 220, 209, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.9);
          transform: translateY(-2px);
        }

        .chat-box.submitting {
          animation: submit-pulse 0.5s ease-out;
        }

        @keyframes submit-pulse {
          0% { transform: scale(1); box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 12px 24px rgba(110, 220, 209, 0.12), 0 0 0 0 rgba(110, 220, 209, 0.4); }
          50% { transform: scale(1.02); box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 12px 24px rgba(110, 220, 209, 0.12), 0 0 0 20px rgba(110, 220, 209, 0); }
          100% { transform: scale(1); box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 12px 24px rgba(110, 220, 209, 0.12), 0 0 0 0 rgba(110, 220, 209, 0); }
        }

        .chat-input {
          width: 100%;
          padding: 20px 24px;
          background: transparent;
          border: none;
          font-size: 1.125rem;
          font-family: inherit;
          color: var(--text-primary);
          line-height: 1.6;
          min-height: 100px;
          resize: none;
        }

        .chat-input::placeholder {
          color: var(--text-muted);
        }

        .chat-input:focus {
          outline: none;
        }

        .chat-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-top: 1px solid var(--border-subtle);
          background: rgba(248, 250, 250, 0.5);
        }

        .chat-attach {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: transparent;
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: all 0.2s ease;
        }

        .chat-attach:hover {
          background: var(--scout-dim);
          border-color: var(--border);
          color: var(--summit);
        }

        .chat-submit {
          padding: 10px 24px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--scout) 0%, var(--scout-dark) 100%);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: white;
          font-size: 0.9375rem;
          font-weight: 600;
          font-family: inherit;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(110, 220, 209, 0.4);
        }

        .chat-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(110, 220, 209, 0.5);
        }

        /* Attachment preview */
        .attachment-preview {
          display: none;
          padding: 12px 16px;
          border-top: 1px solid var(--border-subtle);
          gap: 8px;
          flex-wrap: wrap;
        }

        .attachment-preview.has-files {
          display: flex;
        }

        .attachment-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--scout-dim);
          border-radius: 8px;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .attachment-item img {
          width: 32px;
          height: 32px;
          object-fit: cover;
          border-radius: 4px;
        }

        /* Quick actions */
        .quick-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
        }

        .quick-btn {
          padding: 12px 20px;
          background: rgba(110, 220, 209, 0.08);
          border: 1px solid rgba(110, 220, 209, 0.2);
          border-radius: 12px;
          font-size: 0.9375rem;
          font-weight: 500;
          font-family: inherit;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 8px rgba(110, 220, 209, 0.08);
        }

        .quick-btn:hover {
          background: rgba(110, 220, 209, 0.15);
          border-color: var(--border);
          color: var(--text-primary);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(110, 220, 209, 0.2);
        }

        /* Robot container */
        .robot-container {
          position: fixed;
          bottom: 8%;
          right: calc(50% - 520px);
          z-index: 5;
          transform: scale(0.45);
          transform-origin: bottom right;
          animation: float 4s ease-in-out infinite;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        @keyframes float {
          0%, 100% { transform: scale(0.45) translateY(0) rotate(-3deg); }
          50% { transform: scale(0.45) translateY(-18px) rotate(0deg); }
        }

        .robot-glow {
          position: absolute;
          top: 40%;
          left: 30%;
          transform: translate(-50%, -50%);
          width: 400px;
          height: 400px;
          background: radial-gradient(ellipse 70% 50% at 60% 50%, rgba(110, 220, 209, 0.2) 0%, transparent 70%);
          border-radius: 50%;
          animation: glow-pulse 4s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
        }

        .robot-shadow {
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 180px;
          height: 24px;
          background: radial-gradient(ellipse 100% 100%, rgba(11, 30, 45, 0.18) 0%, rgba(11, 30, 45, 0.08) 40%, transparent 70%);
          border-radius: 50%;
          filter: blur(12px);
          animation: shadow-pulse 4s ease-in-out infinite;
        }

        @keyframes shadow-pulse {
          0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.6; transform: translateX(-50%) scale(0.85); }
        }

        /* Robot parts */
        .robot {
          width: 320px;
          height: 450px;
          position: relative;
        }

        .robot::before {
          content: '';
          position: absolute;
          top: 0;
          left: -20px;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, rgba(110, 220, 209, 0.35) 0%, rgba(110, 220, 209, 0.15) 15%, transparent 40%);
          filter: blur(20px);
          pointer-events: none;
          z-index: 100;
          mix-blend-mode: soft-light;
        }

        .robot::after {
          content: '';
          position: absolute;
          top: 10%;
          left: -10px;
          width: 60%;
          height: 70%;
          background: linear-gradient(100deg, rgba(110, 220, 209, 0.25) 0%, transparent 50%);
          filter: blur(15px);
          pointer-events: none;
          z-index: 100;
        }

        .mat-white {
          background: #F8FAFA;
          box-shadow: inset 10px 10px 30px white, inset -15px -15px 50px #C8D4D2, inset -25px 0 40px rgba(110, 220, 209, 0.08), 0 25px 50px rgba(11, 30, 45, 0.1);
        }

        .mat-teal {
          background: radial-gradient(circle at 35% 25%, #6EDCD1, #3BA99E);
          box-shadow: inset 3px 3px 6px rgba(255,255,255,0.6), inset 8px 8px 20px rgba(255,255,255,0.4), inset -15px 0 25px rgba(110, 220, 209, 0.2), 0 15px 30px rgba(59, 169, 158, 0.25);
        }

        .mat-metal {
          background: linear-gradient(115deg, #9AB0AD 10%, #E6EDEC 30%, #9AB0AD 60%, #5D7573 90%);
          box-shadow: inset 1px 1px 2px rgba(255,255,255,0.7);
        }

        .head {
          position: absolute;
          top: 35px;
          left: 50%;
          transform: translateX(-50%);
          width: 270px;
          height: 220px;
          border-radius: 85px;
          z-index: 10;
        }

        .face-screen {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -45%);
          width: 220px;
          height: 170px;
          background: #0B1E2D;
          border-radius: 60px;
          box-shadow: inset 0 0 40px black, 0 4px 10px rgba(255,255,255,0.2);
          overflow: hidden;
        }

        .face-screen::before {
          content: '';
          position: absolute;
          top: -70px;
          left: -90px;
          width: 280px;
          height: 220px;
          background: linear-gradient(140deg, rgba(255,255,255,0.15) 0%, transparent 55%);
          border-radius: 50%;
        }

        .eye {
          position: absolute;
          top: 48px;
          width: 52px;
          height: 52px;
          background: #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 0 20px #FFFFFF, 0 0 50px #6EDCD1, 0 0 80px #6EDCD1;
          animation: blink 5s infinite;
        }

        .eye.left { left: 48px; }
        .eye.right { right: 48px; }

        .smile {
          position: absolute;
          bottom: 42px;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 50px;
          border-bottom: 10px solid #FFFFFF;
          border-radius: 50%;
          filter: drop-shadow(0 0 10px #6EDCD1);
        }

        .smile::before, .smile::after {
          content: '';
          position: absolute;
          bottom: -5px;
          width: 10px;
          height: 10px;
          background: #FFFFFF;
          border-radius: 50%;
        }

        .smile::before { left: -3px; }
        .smile::after { right: -3px; }

        .ear {
          position: absolute;
          top: 100px;
          width: 55px;
          height: 85px;
          border-radius: 28px;
          z-index: 1;
        }

        .ear.left { left: 0px; }
        .ear.right { right: 0px; }

        .antenna-base {
          position: absolute;
          top: 15px;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 40px;
          z-index: 1;
          border-radius: 10px;
        }

        .antenna-ball {
          position: absolute;
          top: 0px;
          left: 50%;
          transform: translateX(-50%);
          width: 38px;
          height: 38px;
          border-radius: 50%;
          z-index: 2;
        }

        .body {
          position: absolute;
          top: 250px;
          left: 50%;
          transform: translateX(-50%);
          width: 190px;
          height: 170px;
          border-radius: 65px 65px 85px 85px;
          z-index: 5;
        }

        .body::after {
          content: '';
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 25px;
          background: rgba(11, 30, 45, 0.15);
          filter: blur(12px);
          border-radius: 50%;
        }

        .arm-group {
          position: absolute;
          top: 285px;
          z-index: 4;
          transform-origin: top center;
        }

        .arm-group.left { left: 35px; transform: rotate(20deg); }
        .arm-group.right { right: 35px; transform: scaleX(-1) rotate(20deg); }

        .shoulder {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          position: absolute;
          top: 0;
          left: -8px;
          z-index: 2;
        }

        .segment {
          width: 34px;
          height: 24px;
          border-radius: 9px;
          position: absolute;
          left: -4px;
        }

        .segment.s1 { top: 28px; transform: rotate(-5deg); z-index: 3; }
        .segment.s2 { top: 46px; transform: rotate(-15deg) translateX(3px); z-index: 4; }
        .segment.s3 { top: 64px; transform: rotate(-25deg) translateX(8px); z-index: 5; }

        .wrist-cuff {
          width: 68px;
          height: 58px;
          border-radius: 28px;
          position: absolute;
          top: 82px;
          left: 5px;
          transform: rotate(-35deg);
          z-index: 6;
        }

        .claw {
          width: 52px;
          height: 52px;
          border: 13px solid #9AB0AD;
          border-radius: 50%;
          border-top-color: transparent;
          transform: rotate(-60deg);
          position: absolute;
          top: 130px;
          left: 20px;
          z-index: 5;
          filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.1));
        }

        .claw::before, .claw::after {
          content: '';
          position: absolute;
          width: 13px;
          height: 13px;
          background: #9AB0AD;
          border-radius: 50%;
        }

        .claw::before { top: 3px; left: 3px; }
        .claw::after { bottom: 3px; right: 3px; }

        @keyframes blink {
          0%, 48%, 52%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.1); }
        }

        /* Footer */
        .landing-footer {
          position: relative;
          z-index: 10;
          padding: 32px 24px;
          text-align: center;
          background: rgba(255, 255, 255, 0.5);
          border-top: 1px solid var(--border-subtle);
          transition: opacity 0.3s ease;
        }

        /* Transition overlay */
        .transition-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0);
          backdrop-filter: blur(0px);
          -webkit-backdrop-filter: blur(0px);
          opacity: 0;
          pointer-events: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .transition-overlay.active {
          opacity: 1;
          pointer-events: all;
          background: rgba(250, 252, 252, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .transition-overlay.fade-out {
          background: rgba(255, 255, 255, 1);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
        }

        .transition-scout {
          transform: scale(0.55);
          opacity: 0;
          transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          -webkit-mask-image: linear-gradient(to bottom, black 75%, transparent 98%);
          mask-image: linear-gradient(to bottom, black 75%, transparent 98%);
        }

        .transition-overlay.active .transition-scout {
          transform: scale(0.5);
          opacity: 1;
        }

        .transition-scout::before {
          content: '';
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(110, 220, 209, 0.3) 0%, rgba(110, 220, 209, 0.1) 40%, transparent 65%);
          border-radius: 50%;
          animation: transition-glow 2s ease-in-out infinite;
          z-index: -1;
        }

        @keyframes transition-glow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        }

        .transition-scout .eye {
          animation: eyes-brighten 0.8s ease-out forwards;
          box-shadow: 0 0 30px #FFFFFF, 0 0 60px #6EDCD1, 0 0 100px #6EDCD1;
        }

        @keyframes eyes-brighten {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }

        .transition-message {
          margin-top: 20px;
          text-align: center;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.25s;
        }

        .transition-overlay.active .transition-message {
          opacity: 1;
          transform: translateY(0);
        }

        .transition-message h2 {
          font-size: 2.5rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin-bottom: 12px;
          background: linear-gradient(90deg, var(--text-primary) 0%, var(--text-primary) 40%, var(--scout) 50%, var(--text-primary) 60%, var(--text-primary) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 2.5s linear infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        .transition-message p {
          font-size: 1.125rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .header-nav { display: none; }
        }

        @media (max-width: 768px) {
          .landing-header { padding: 12px 20px; }
          .landing-main { padding: 100px 20px 60px; }
          .headline { font-size: 1.75rem; }
          .subheadline { font-size: 1rem; }
          .chat-input { padding: 16px 18px; font-size: 16px; min-height: 80px; }
          .chat-toolbar { padding: 10px 12px; }
          .chat-attach { width: 36px; height: 36px; }
          .chat-submit { padding: 8px 16px; font-size: 0.875rem; }
          .quick-btn { padding: 10px 16px; font-size: 0.875rem; }
          .robot-container { transform: scale(0.3); bottom: 2%; right: 3%; }
          .robot-glow { width: 200px; height: 200px; }
          .robot-shadow { display: none; }
        }
      `}</style>

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
    </>
  );
}
