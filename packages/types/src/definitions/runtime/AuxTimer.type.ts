export enum SimplePlayback {
  Start = 'start',
  Pause = 'pause',
  Stop = 'stop',
}

export enum SimpleDirection {
  CountUp = 'count-up',
  CountDown = 'count-down',
}

export type SimpleTimerState = {
  duration: number;
  current: number;
  playback: SimplePlayback;
  direction: SimpleDirection;
  /** Empty string when unnamed */
  name: string;
};

/**
 * A user-created timer in addition to the fixed auxtimer1/2/3 - there can be any number of
 * these, so each needs its own identity instead of a fixed index
 */
export type CustomTimerState = SimpleTimerState & { id: string };
