import { CustomTimerState, Playback, SimpleDirection, SimplePlayback } from 'ontime-types';
import { millisToString, parseUserTime } from 'ontime-utils';
import { useState } from 'react';
import { IoArrowDown, IoArrowUp, IoClose, IoPause, IoPlay, IoStop } from 'react-icons/io5';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import { setCustomTimer } from '../../../../common/hooks/useSocket';
import TapButton from '../tap-button/TapButton';

import style from './CustomTimer.module.scss';

interface CustomTimerProps {
  timer: CustomTimerState;
}

/**
 * One row in the unlimited custom-timers list - same transport controls as the fixed
 * aux1/2/3 timers (AuxTimer), plus a name you can actually type (there is no settings page
 * for these, unlike aux1/2/3) and a remove button, since the list can grow and shrink.
 */
export default function CustomTimer({ timer }: CustomTimerProps) {
  const { id, playback, direction, name, duration } = timer;
  const [draftName, setDraftName] = useState(name);

  const isActive = playback !== SimplePlayback.Stop;
  const playbackAction = playback === SimplePlayback.Start ? 'pause' : 'play';

  const toggleDirection = () => {
    const newDirection = direction === SimpleDirection.CountDown ? SimpleDirection.CountUp : SimpleDirection.CountDown;
    setCustomTimer.setDirection(id, newDirection);
  };

  const handleTimeUpdate = (_field: string, value: string) => {
    setCustomTimer.setDuration(id, parseUserTime(value));
  };

  const commitName = () => {
    if (draftName !== name) {
      setCustomTimer.rename(id, draftName);
    }
  };

  return (
    <div className={style.row}>
      <input
        className={style.nameInput}
        value={draftName}
        onChange={(event) => setDraftName(event.target.value)}
        onBlur={commitName}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
        }}
        placeholder='Unnamed timer'
      />

      <div className={style.input}>
        {isActive ? (
          <div className={style.fakeInput}>{millisToString(duration)}</div>
        ) : (
          <TimeInput
            submitHandler={handleTimeUpdate}
            name={`custom-timer-${id}`}
            time={duration}
            placeholder='Duration'
          />
        )}
        <TapButton onClick={toggleDirection} aspect='tight' disabled={isActive}>
          {direction === SimpleDirection.CountDown ? <IoArrowDown /> : <IoArrowUp />}
        </TapButton>
      </div>

      <div className={style.transport}>
        {playbackAction === 'play' ? (
          <TapButton onClick={() => setCustomTimer.start(id)} theme={Playback.Play}>
            <IoPlay />
          </TapButton>
        ) : (
          <TapButton onClick={() => setCustomTimer.pause(id)} theme={Playback.Pause}>
            <IoPause />
          </TapButton>
        )}
        <TapButton onClick={() => setCustomTimer.stop(id)} theme={Playback.Stop} disabled={!isActive}>
          <IoStop />
        </TapButton>
        <TapButton onClick={() => setCustomTimer.remove(id)} aria-label='Remove timer'>
          <IoClose />
        </TapButton>
      </div>
    </div>
  );
}
