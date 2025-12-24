'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseVoiceRecordingReturn {
  isRecording: boolean;
  audioData: number[];
  /** The latest finalized transcript segment (clears after being consumed) */
  transcript: string;
  /** Real-time interim transcript (not yet finalized) */
  interimTranscript: string;
  /** Full accumulated transcript from the session */
  fullTranscript: string;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  /** Clear the latest transcript after consuming it */
  clearTranscript: () => void;
  error: string | null;
  isSupported: boolean;
}

// SpeechRecognition type for browsers that support it
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export function useVoiceRecording(): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<number[]>([]);
  // Latest finalized segment (for consumption by input field)
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  // Full accumulated transcript
  const [fullTranscript, setFullTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Check if browser supports required APIs
  const isSupported = typeof window !== 'undefined' &&
    !!(navigator.mediaDevices?.getUserMedia) &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Update audio data at ~60fps
  const updateAudioData = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Sample down to ~24 bars for visualization
    const barCount = 24;
    const sampledData: number[] = [];
    const step = Math.floor(dataArray.length / barCount);

    for (let i = 0; i < barCount; i++) {
      // Average a few frequency bins for each bar
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += dataArray[i * step + j];
      }
      sampledData.push(Math.round(sum / step));
    }

    setAudioData(sampledData);

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(updateAudioData);
  }, [isRecording]);

  // Clear the latest transcript segment after consuming
  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Voice recording is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    try {
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      setFullTranscript('');

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      mediaStreamRef.current = stream;

      // Set up Web Audio API for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Start audio visualization
      setIsRecording(true);

      // Set up Speech Recognition for transcription
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          console.log('[Voice] Speech recognition started');
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalSegment = '';
          let interim = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const text = result[0].transcript;

            if (result.isFinal) {
              finalSegment += text;
            } else {
              interim += text;
            }
          }

          // When we get a final segment, set it as the latest transcript
          if (finalSegment) {
            console.log('[Voice] Final segment:', finalSegment);
            setTranscript(finalSegment);
            setFullTranscript(prev => prev + (prev ? ' ' : '') + finalSegment.trim());
          }

          setInterimTranscript(interim);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('[Voice] Speech recognition error:', event.error, event.message);

          // Handle specific errors
          switch (event.error) {
            case 'not-allowed':
              setError('Microphone access denied. Please allow microphone access in browser settings.');
              break;
            case 'no-speech':
              // This is normal - just means silence was detected
              console.log('[Voice] No speech detected, continuing...');
              break;
            case 'audio-capture':
              setError('No microphone found. Please connect a microphone.');
              break;
            case 'network':
              setError('Network error. Speech recognition requires an internet connection.');
              break;
            case 'aborted':
              // User or system stopped recognition - not an error
              break;
            default:
              setError(`Speech recognition error: ${event.error}`);
          }
        };

        recognition.onend = () => {
          console.log('[Voice] Speech recognition ended');
          // If still recording, restart recognition (it can timeout)
          if (isRecording && recognitionRef.current === recognition) {
            try {
              recognition.start();
              console.log('[Voice] Restarted speech recognition');
            } catch (e) {
              console.log('[Voice] Could not restart recognition:', e);
            }
          }
        };

        recognition.start();
        console.log('[Voice] Recognition started successfully');
      } else {
        setError('Speech recognition not available. Try using Chrome or Edge browser.');
      }

      // Start animation loop after state is set
      requestAnimationFrame(() => {
        animationFrameRef.current = requestAnimationFrame(updateAudioData);
      });

    } catch (err) {
      console.error('[Voice] Error starting recording:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Microphone access denied. Please allow microphone access in browser settings.');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone.');
        } else {
          setError(`Error starting recording: ${err.message}`);
        }
      }
      setIsRecording(false);
    }
  }, [isSupported, updateAudioData, isRecording]);

  const stopRecording = useCallback(() => {
    console.log('[Voice] Stopping recording...');

    // Stop animation loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
      recognitionRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setIsRecording(false);
    setAudioData([]);
    setInterimTranscript('');
    // Note: We keep transcript and fullTranscript so they can be consumed after stopping
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    isRecording,
    audioData,
    transcript,
    interimTranscript,
    fullTranscript,
    startRecording,
    stopRecording,
    clearTranscript,
    error,
    isSupported,
  };
}
