import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useIndicatorState } from './useIndicatorState';
import type { VoiceSessionState } from '@/types/voiceSession';

describe('useIndicatorState', () => {
  it('toggles ripple when listening', () => {
    vi.useFakeTimers();
    const session: VoiceSessionState = {
      isConnecting: false,
      isConnected: true,
      isListening: true,
      isSpeaking: false,
      transcript: ''
    };
    const { result, rerender } = renderHook((p: VoiceSessionState) => useIndicatorState(p), { initialProps: session });
    expect(result.current.ripple).toBe(true);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.ripple).toBe(false);
    vi.useRealTimers();
  });

  it('returns correct background color', () => {
    const session: VoiceSessionState = {
      isConnecting: true,
      isConnected: false,
      isListening: false,
      isSpeaking: false,
      transcript: ''
    };
    const { result, rerender } = renderHook((p: VoiceSessionState) => useIndicatorState(p), { initialProps: session });
    expect(result.current.getBgColorClass()).toBe('bg-gray-600');
    rerender({ ...session, isConnecting: false, isConnected: true });
    expect(result.current.getBgColorClass()).toBe('bg-hero/80 hover:bg-hero');
  });
});
