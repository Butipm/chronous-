import { memo } from 'react';

import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import ErrorBoundary from '../../../common/components/error-boundary/ErrorBoundary';
import ViewNavigationMenu from '../../../common/components/navigation-menu/ViewNavigationMenu';
import ProtectRoute from '../../../common/components/protect-route/ProtectRoute';
import { handleLinks } from '../../../common/utils/linkUtils';
import { getIsNavigationLocked } from '../../../externals';
import MessageControl from './MessageControl';

import style from './MessageControlExport.module.scss';

interface MessageControlExportProps {
  feedUrl?: string | null;
  onFeedChange?: (url: string | null) => void;
}

export default memo(MessageControlExport);
function MessageControlExport({ feedUrl, onFeedChange }: MessageControlExportProps = {}) {
  const isExtracted = window.location.pathname.includes('/messagecontrol');

  return (
    <ProtectRoute permission='editor'>
      <Editor.Panel className={style.growPanel} data-testid='panel-messages-control'>
        {!isExtracted && <Editor.CornerExtract onClick={(event) => handleLinks('messagecontrol', event)} />}
        {isExtracted && <ViewNavigationMenu suppressSettings isNavigationLocked={getIsNavigationLocked()} />}

        <div className={style.contentLayout}>
          <ErrorBoundary>
            <MessageControl feedUrl={feedUrl} onFeedChange={onFeedChange} />
          </ErrorBoundary>
        </div>
      </Editor.Panel>
    </ProtectRoute>
  );
}
