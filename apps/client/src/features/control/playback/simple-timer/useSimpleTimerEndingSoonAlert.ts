import { SimpleDirection, SimplePlayback } from 'ontime-types';
import { useEffect, useRef } from 'react';

import chime from '../../../../assets/sounds/chime.wav';
import { isSimpleTimerEndingSoon } from './simpleTimerAlert.utils';

/**
 * Per-aux/custom-timer wrap-up alert: a pulsing visual plus a one-shot chime when a running
 * count-down timer crosses 60s left. Each call owns its own Audio element (unlike the single
 * shared one for the main timer) since several of these can be running and wrapping up at once,
 * and sharing one element would cut off one timer's chime when another starts.
 */
export function useSimpleTimerEndingSoonAlert(current: number, playback: SimplePlayback, direction: SimpleDirection): boolean {
  const endingSoon = isSimpleTimerEndingSoon(current, playback, direction);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wasEndingSoonRef = useRef(false);

  useEffect(() => {
    if (endingSoon && !wasEndingSoonRef.current) {
      if (!audioRef.current) {
        audioRef.current = new Audio(chime);
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // playback is blocked until the page has had a user interaction
      });
    }
    wasEndingSoonRef.current = endingSoon;
  }, [endingSoon]);

  return endingSoon;
}
