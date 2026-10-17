import { memo } from 'react';

import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import ErrorBoundary from '../../../common/components/error-boundary/ErrorBoundary';
import ViewNavigationMenu from '../../../common/components/navigation-menu/ViewNavigationMenu';
import ProtectRoute from '../../../common/components/protect-route/ProtectRoute';
import { handleLinks } from '../../../common/utils/linkUtils';
import { getIsNavigationLocked } from '../../../externals';
import PlaybackControl from './PlaybackControl';

import style from './TimerControlExport.module.scss';

interface TimerControlExportProps {
  feedUrl?: string | null;
  onFeedChange?: (url: string | null) => void;
}

export default memo(TimerControlExport);
function TimerControlExport({ feedUrl, onFeedChange }: TimerControlExportProps = {}) {
  const isExtracted = window.location.pathname.includes('/timercontrol');

  return (
    <ProtectRoute permission='editor'>
      <Editor.Panel data-testid='panel-timer-control'>
        {!isExtracted && <Editor.CornerExtract onClick={(event) => handleLinks('timercontrol', event)} />}
        {isExtracted && <ViewNavigationMenu suppressSettings isNavigationLocked={getIsNavigationLocked()} />}

        <div className={style.content}>
          <ErrorBoundary>
            <PlaybackControl feedUrl={feedUrl} onFeedChange={onFeedChange} />
          </ErrorBoundary>
        </div>
      </Editor.Panel>
    </ProtectRoute>
  );
}
