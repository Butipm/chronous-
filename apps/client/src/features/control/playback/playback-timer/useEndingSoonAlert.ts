import { Playback, TimerPhase } from 'ontime-types';
import { useEffect, useRef } from 'react';

import bell from '../../../../assets/sounds/bell.wav';
import { isEndingSoon } from '../playbackControl.utils';

// Single shared element - avoids re-fetching the asset and lets us cut off a sound still
// playing from a previous event when a new one crosses the threshold
let alertAudio: HTMLAudioElement | null = null;
function getAlertAudio(): HTMLAudioElement {
  if (!alertAudio) {
    alertAudio = new Audio(bell);
  }
  return alertAudio;
}

/**
 * Tells the controller (desktop panel, extracted /timercontrol window, or a phone that
 * opened a shared link to it) that the running timer has 60s or less left, so the operator
 * gets an unmissable heads-up regardless of whether this event has its own warning/danger
 * times configured.
 *
 * Returns whether we are currently inside that window (for a sustained visual indicator) and
 * fires a one-shot sound exactly on the transition into it, so it doesn't replay on every tick
 * or on an unrelated re-render.
 */
export function useEndingSoonAlert(current: number | null, playback: Playback, phase: TimerPhase): boolean {
  const endingSoon = isEndingSoon(current, playback, phase);

  const wasEndingSoonRef = useRef(false);
  useEffect(() => {
    if (endingSoon && !wasEndingSoonRef.current) {
      const audio = getAlertAudio();
      audio.currentTime = 0;
      audio.play().catch(() => {
        // playback is blocked until the page has had a user interaction, same constraint as the viewer's end sound
      });
    }
    wasEndingSoonRef.current = endingSoon;
  }, [endingSoon]);

  return endingSoon;
}
