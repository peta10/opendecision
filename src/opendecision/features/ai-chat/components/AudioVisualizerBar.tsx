'use client';

import React from 'react';
import { LiveWaveform } from '@/components/ui/live-waveform';
import './AudioVisualizerBar.css';

interface AudioVisualizerBarProps {
  isRecording: boolean;
  onStopRecording: () => void;
}

export function AudioVisualizerBar({
  isRecording,
  onStopRecording
}: AudioVisualizerBarProps) {
  if (!isRecording) {
    return null;
  }

  return (
    <div className="audio-visualizer-container">
      <div className="waveform-wrapper">
        <LiveWaveform
          active={isRecording}
          height={28}
          barWidth={3}
          barGap={2}
          barColor="#5BDFC2"
          fadeEdges={true}
          fadeWidth={20}
          mode="static"
          sensitivity={1.2}
        />
      </div>
      <button
        type="button"
        onClick={onStopRecording}
        className="stop-circle"
        title="Stop recording"
      >
        <span className="stop-icon" />
      </button>
    </div>
  );
}
