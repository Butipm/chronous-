import { lazy, useState } from 'react';

import UrlFeedOverlay, { FeedFrame } from '../../common/components/url-feed-overlay/UrlFeedOverlay';
import { RundownScopeProvider } from '../../common/context/RundownScopeContext';
import TrackingPlaybackBar from '../../features/control/playback/tracking-playback-bar/TrackingPlaybackBar';
import { AppMode } from '../../ontimeConfig';
import TitleList from './title-list/TitleList';
import { EditorLayoutMode, useEditorLayout } from './useEditorLayout';

import styles from './Editor.module.scss';

const Rundown = lazy(() => import('../../features/rundown/RundownExport'));
const TimerControl = lazy(() => import('../../features/control/playback/TimerControlExport'));
const MessageControl = lazy(() => import('../../features/control/message/MessageControlExport'));

export default function Editor() {
  const { layoutMode } = useEditorLayout();

  if (layoutMode === EditorLayoutMode.CONTROL) {
    return (
      <div id='panels' className={styles.panelContainer}>
        <div className={styles.left}>
          <TimerControl />
          <MessageControl />
        </div>
        <RundownScopeProvider rundownId={null}>
          <Rundown />
        </RundownScopeProvider>
      </div>
    );
  }

  if (layoutMode === EditorLayoutMode.TRACKING) {
    return (
      <div id='panels' className={`${styles.panelContainer} ${styles.panelContainerTracking}`}>
        {/* the titles and the rundown share a scope, so they follow one cursor */}
        <RundownScopeProvider rundownId={null}>
          <div className={styles.rundownLayout}>
            <div className={styles.titlesPanel}>
              <TitleList mode={AppMode.Run} />
            </div>
            <div className={styles.rundownPanel}>
              <Rundown />
            </div>
          </div>
        </RundownScopeProvider>
        <TrackingPlaybackBar />
      </div>
    );
  }

  return <PlanningLayout />;
}

// Planning mode deliberately omits TimerControl/MessageControl entirely (it is the
// rundown-building layout, not a playback surface), which is also where Feed Preview
// normally lives - so it had zero presence here, not just low visibility like the editor's
// own trigger had. A floating corner trigger (same pattern as TrackingPlaybackBar's bottom-
// bar one) adds it back without taking permanent layout space from a view whose whole point
// is maximizing room for the rundown/titles.
function PlanningLayout() {
  const [feedUrl, setFeedUrl] = useState<string | null>(null);

  return (
    <div id='panels' className={`${styles.panelContainer} ${styles.panelContainerPlanning}`}>
      <div className={styles.feedTrigger}>
        <UrlFeedOverlay
          feedUrl={feedUrl}
          onFeedChange={setFeedUrl}
          storageKey='ontime-planning-feed-url'
          size={feedUrl ? 'small' : 'medium'}
        />
      </div>
      {feedUrl && (
        <div className={styles.feedPreview}>
          <FeedFrame url={feedUrl} />
        </div>
      )}
      <RundownScopeProvider rundownId={null}>
        <div className={styles.rundownLayout}>
          <div className={styles.titlesPanel}>
            <TitleList mode={AppMode.Edit} />
          </div>
          <div className={styles.rundownPanel}>
            <Rundown />
          </div>
        </div>
      </RundownScopeProvider>
    </div>
  );
}
