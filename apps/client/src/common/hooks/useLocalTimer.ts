import { useEffect, useMemo, useRef, useState } from 'react';

import { Playback, TimerPhase, type MaybeNumber } from 'ontime-types';

/** How long without a server update before the local clock takes over. */
export const STALE_AFTER_MS = 1200;
const TICK_MS = 250;

export interface InterpolatableTimer {
  current: MaybeNumber;
  elapsed?: MaybeNumber;
  playback: Playback;
  phase?: TimerPhase;
}

/**
 * A running timer only reaches the client once per second, and nothing at all while
 * the websocket is down - which on a phone means the countdown freezes at the last
 * value sent (screen lock, Wi-Fi handoff, a server hiccup). Competitors market
 * "screens keep counting during network drops"; this is that behaviour.
 *
 * While updates are flowing, the server value is used untouched. Only once a message
 * is overdue does the display advance itself, and the next server message snaps it
 * back in line.
 */
export function isTimerRunning(timer: Pick<InterpolatableTimer, 'playback' | 'phase'>): boolean {
  // Roll mode with a pending event is counting down to a start the timer has not
  // begun yet, so the running values do not move.
  if (timer.playback === Playback.Roll && timer.phase === TimerPhase.Pending) return false;
  return timer.playback === Playback.Play || timer.playback === Playback.Roll;
}

/**
 * Advances the timer values by a wall-clock delta. `current` is a countdown and
 * `elapsed` is a count-up, so they move in opposite directions.
 */
export function advanceTimer<T extends InterpolatableTimer>(timer: T, deltaMs: number): T {
  if (deltaMs <= 0) return timer;
  return {
    ...timer,
    current: timer.current === null || timer.current === undefined ? timer.current : timer.current - deltaMs,
    elapsed: timer.elapsed === null || timer.elapsed === undefined ? timer.elapsed : timer.elapsed + deltaMs,
  };
}

export function useLocalTimer<T extends InterpolatableTimer>(timer: T): T {
  const anchor = useRef({ timer, at: Date.now() });
  const [now, setNow] = useState(() => Date.now());

  // Every server message re-anchors: from here on the local clock is only a fallback.
  useEffect(() => {
    anchor.current = { timer, at: Date.now() };
  }, [timer]);

  const running = isTimerRunning(timer);

  useEffect(() => {
    if (!running) return undefined;
    const id = window.setInterval(() => {
      // Only wake the component once updates have actually stopped arriving - a
      // healthy connection must not re-render the view four times a second.
      if (Date.now() - anchor.current.at > STALE_AFTER_MS) {
        setNow(Date.now());
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [running]);

  return useMemo(() => {
    const age = now - anchor.current.at;
    if (!running || age <= STALE_AFTER_MS) return timer;
    return advanceTimer(timer, age);
  }, [timer, now, running]);
}
