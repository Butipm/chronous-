import { Playback, TimerPhase } from 'ontime-types';
import { IoPause, IoPlay, IoPlaySkipBack, IoPlaySkipForward, IoReload, IoStop } from 'react-icons/io5';

import { setPlayback } from '../../../../common/hooks/useSocket';
import { getPlaybackControlState } from '../playbackControl.utils';
import TapButton from '../tap-button/TapButton';

import style from './PlaybackButtons.module.scss';

interface PlaybackButtonsProps {
  playback: Playback;
  numEvents: number;
  selectedEventIndex: number | null;
  timerPhase: TimerPhase;
}

export default function PlaybackButtons({ playback, numEvents, selectedEventIndex, timerPhase }: PlaybackButtonsProps) {
  const {
    isPlaying,
    isPaused,
    isRolling,
    disableGo,
    disableNext,
    disablePrev,
    disableStart,
    disablePause,
    disableRoll,
    disableStop,
    disableReload,
    goAction,
    goLabel,
  } = getPlaybackControlState({
    playback,
    numEvents,
    selectedEventIndex,
    timerPhase,
  });

  return (
    <div className={style.buttonContainer}>
      <TapButton disabled={disableGo} onClick={goAction} aspect='fill' className={style.go}>
        {goLabel}
      </TapButton>
      <div className={style.playbackContainer}>
        <TapButton
          onClick={setPlayback.start}
          disabled={disableStart}
          theme={Playback.Play}
          active={isPlaying}
          aria-label='Play'
        >
          <IoPlay />
        </TapButton>

        <TapButton
          onClick={setPlayback.pause}
          disabled={disablePause}
          theme={Playback.Pause}
          active={isPaused}
          aria-label='Pause'
        >
          <IoPause />
        </TapButton>
      </div>
      <div className={style.transportContainer}>
        <TapButton onClick={setPlayback.previous} disabled={disablePrev} aria-label='Previous event'>
          <IoPlaySkipBack />
        </TapButton>
        <TapButton onClick={setPlayback.next} disabled={disableNext} aria-label='Next event'>
          <IoPlaySkipForward />
        </TapButton>
      </div>
      <div className={style.extra}>
        <TapButton onClick={setPlayback.roll} disabled={disableRoll} theme={Playback.Roll} active={isRolling}>
          Roll
        </TapButton>
        <TapButton onClick={setPlayback.reload} disabled={disableReload} aria-label='Reload current event'>
          <IoReload className={style.invertX} />
        </TapButton>
        <TapButton onClick={setPlayback.stop} disabled={disableStop} theme={Playback.Stop} aria-label='Stop'>
          <IoStop />
        </TapButton>
      </div>
    </div>
  );
}
