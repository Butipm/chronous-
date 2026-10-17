import { SimpleDirection, SimplePlayback } from 'ontime-types';

/** Matches the main timer's own ENDING_SOON_THRESHOLD_MS - same fixed heads-up window */
export const SIMPLE_TIMER_ENDING_SOON_THRESHOLD_MS = 60_000;

/**
 * Whether a running aux/custom timer has 60s or less left. Only applies to count-down timers -
 * a count-up timer has no end to wrap up toward.
 */
export function isSimpleTimerEndingSoon(current: number, playback: SimplePlayback, direction: SimpleDirection): boolean {
  return (
    playback === SimplePlayback.Start &&
    direction === SimpleDirection.CountDown &&
    current > 0 &&
    current <= SIMPLE_TIMER_ENDING_SOON_THRESHOLD_MS
  );
}
