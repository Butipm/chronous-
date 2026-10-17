import { SimpleDirection, SimplePlayback } from 'ontime-types';

import { isSimpleTimerEndingSoon, SIMPLE_TIMER_ENDING_SOON_THRESHOLD_MS } from '../simpleTimerAlert.utils';

describe('isSimpleTimerEndingSoon', () => {
  it('is true for a running count-down timer at exactly the threshold', () => {
    expect(
      isSimpleTimerEndingSoon(SIMPLE_TIMER_ENDING_SOON_THRESHOLD_MS, SimplePlayback.Start, SimpleDirection.CountDown),
    ).toBe(true);
  });

  it('is true just under the threshold', () => {
    expect(isSimpleTimerEndingSoon(1_000, SimplePlayback.Start, SimpleDirection.CountDown)).toBe(true);
  });

  it('is false above the threshold', () => {
    expect(isSimpleTimerEndingSoon(61_000, SimplePlayback.Start, SimpleDirection.CountDown)).toBe(false);
  });

  it('is false at or below zero', () => {
    expect(isSimpleTimerEndingSoon(0, SimplePlayback.Start, SimpleDirection.CountDown)).toBe(false);
    expect(isSimpleTimerEndingSoon(-500, SimplePlayback.Start, SimpleDirection.CountDown)).toBe(false);
  });

  it('is false when paused or stopped, even within the window', () => {
    expect(isSimpleTimerEndingSoon(1_000, SimplePlayback.Pause, SimpleDirection.CountDown)).toBe(false);
    expect(isSimpleTimerEndingSoon(1_000, SimplePlayback.Stop, SimpleDirection.CountDown)).toBe(false);
  });

  it('is false for a count-up timer - there is nothing to wrap up toward', () => {
    expect(isSimpleTimerEndingSoon(1_000, SimplePlayback.Start, SimpleDirection.CountUp)).toBe(false);
  });
});
