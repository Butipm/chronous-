import { IoAdd } from 'react-icons/io5';

import Button from '../../../../common/components/buttons/Button';
import { setCustomTimer, useCustomTimers } from '../../../../common/hooks/useSocket';
import CustomTimer from './CustomTimer';

import style from './CustomTimersList.module.scss';

/**
 * The unlimited sibling to aux1/2/3: add as many extra timers as the show needs, each with
 * its own name, duration, direction, and transport controls.
 */
export default function CustomTimersList() {
  const timers = useCustomTimers();

  return (
    <div className={style.container}>
      {timers.length > 0 && (
        <div className={style.list}>
          {timers.map((timer) => (
            <CustomTimer key={timer.id} timer={timer} />
          ))}
        </div>
      )}
      <Button variant='ghosted' size='small' fluid onClick={() => setCustomTimer.add()}>
        <IoAdd /> Add timer
      </Button>
    </div>
  );
}
