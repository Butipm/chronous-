import { Playback, TimerPhase } from 'ontime-types';
import { describe, expect, it } from 'vitest';

import { advanceTimer, isTimerRunning } from '../useLocalTimer';

describe('isTimerRunning()', () => {
  it('treats a playing timer as running', () => {
    expect(isTimerRunning({ playback: Playback.Play, phase: TimerPhase.Default })).toBe(true);
  });

  it('treats roll mode as running once the event is under way', () => {
    expect(isTimerRunning({ playback: Playback.Roll, phase: TimerPhase.Default })).toBe(true);
  });

  it('does not run while roll mode is still waiting to start', () => {
    expect(isTimerRunning({ playback: Playback.Roll, phase: TimerPhase.Pending })).toBe(false);
  });

  it('does not run when paused, stopped or armed', () => {
    expect(isTimerRunning({ playback: Playback.Pause })).toBe(false);
    expect(isTimerRunning({ playback: Playback.Stop })).toBe(false);
    expect(isTimerRunning({ playback: Playback.Armed })).toBe(false);
  });
});

describe('advanceTimer()', () => {
  const running = { current: 60_000, elapsed: 5_000, playback: Playback.Play };

  it('counts the remaining time down and the elapsed time up', () => {
    const advanced = advanceTimer(running, 1_000);
    expect(advanced.current).toBe(59_000);
    expect(advanced.elapsed).toBe(6_000);
  });

  it('keeps a null countdown null rather than inventing a value', () => {
    const advanced = advanceTimer({ ...running, current: null }, 1_000);
    expect(advanced.current).toBeNull();
  });

  it('leaves an absent elapsed value absent', () => {
    const { elapsed, ...withoutElapsed } = running;
    expect(elapsed).toBeDefined();
    expect(advanceTimer(withoutElapsed, 1_000).elapsed).toBeUndefined();
  });

  it('returns the same object for a zero or negative delta', () => {
    expect(advanceTimer(running, 0)).toBe(running);
    expect(advanceTimer(running, -500)).toBe(running);
  });
});
