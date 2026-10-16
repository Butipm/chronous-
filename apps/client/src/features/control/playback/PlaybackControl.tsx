import { useLocalStorage } from '@mantine/hooks';
import { useState } from 'react';
import { IoChevronDown, IoChevronUp, IoSettingsOutline } from 'react-icons/io5';

import IconButton from '../../../common/components/buttons/IconButton';
import Tooltip from '../../../common/components/tooltip/Tooltip';
import UrlFeedOverlay, { FeedFrame } from '../../../common/components/url-feed-overlay/UrlFeedOverlay';
import { useAuxTimersActive, usePlaybackControl } from '../../../common/hooks/useSocket';
import useAppSettingsNavigation from '../../app-settings/useAppSettingsNavigation';
import AddTime from './add-time/AddTime';
import { AuxTimer } from './aux-timer/AuxTimer';
import PlaybackButtons from './playback-buttons/PlaybackButtons';
import PlaybackTimer from './playback-timer/PlaybackTimer';

import style from './PlaybackControl.module.scss';

export default function PlaybackControl() {
  const data = usePlaybackControl();
  const { setLocation } = useAppSettingsNavigation();
  const [collapsed, setCollapsed] = useLocalStorage({ key: 'ontime-aux-timers-collapsed', defaultValue: false });
  const isAuxTimerActive = useAuxTimersActive();
  const [feedUrl, setFeedUrl] = useState<string | null>(null);

  return (
    <div className={style.mainContainer}>
      <PlaybackTimer>
        <AddTime playback={data.playback} />
      </PlaybackTimer>
      <PlaybackButtons
        playback={data.playback}
        numEvents={data.numEvents}
        selectedEventIndex={data.selectedEventIndex}
        timerPhase={data.timerPhase}
      />
      <div className={style.auxHeader}>
        <span className={style.label}>Feed preview</span>
        <UrlFeedOverlay feedUrl={feedUrl} onFeedChange={setFeedUrl} storageKey='ontime-editor-feed-url' size='small' />
      </div>
      {feedUrl && (
        <div className={style.feedPreview}>
          <FeedFrame url={feedUrl} />
        </div>
      )}
      <div className={style.auxHeader}>
        <span className={style.label}>
          Aux timers
          {collapsed && isAuxTimerActive && <span className={style.activeIndicator} />}
        </span>
        <div className={style.auxHeaderButtons}>
          <Tooltip
            text='Name aux timers'
            render={
              <IconButton
                size='small'
                variant='subtle-white'
                aria-label='Name aux timers'
                onClick={() => setLocation('settings__aux-timers')}
              />
            }
          >
            <IoSettingsOutline />
          </Tooltip>
          <IconButton
            size='small'
            variant='subtle-white'
            aria-label={collapsed ? 'Expand aux timers' : 'Collapse aux timers'}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <IoChevronUp /> : <IoChevronDown />}
          </IconButton>
        </div>
      </div>
      {!collapsed && (
        <div className={style.auxTimers}>
          <AuxTimer index={1} />
          <AuxTimer index={2} />
          <AuxTimer index={3} />
        </div>
      )}
    </div>
  );
}
