export type SecondarySource = 'aux1' | 'aux2' | 'aux3' | 'secondary' | null;

export type TimerMessage = {
  text: string;
  visible: boolean;
  blink: boolean;
  blackout: boolean;
  secondarySource: SecondarySource;
  /** URL fed into the stage timer view (FreeShow, ProPresenter output, YouTube...), or null
   *  when none is set. Broadcast like the rest of TimerMessage - set from the editor or from
   *  the Timer view itself, shown on every connected Timer view. */
  feedUrl: string | null;
};

export type MessageState = {
  timer: TimerMessage;
  secondary: string;
};
