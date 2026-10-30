import { isValueOfEnum } from 'ontime-utils';
import { useSearchParams } from 'react-router';

import { useIsMobileScreen } from '../../common/hooks/useIsMobileScreen';

const layoutParam = 'layout';

export enum EditorLayoutMode {
  CONTROL = 'control',
  PLANNING = 'planning',
  TRACKING = 'tracking',
}

/**
 * Resolves the current editor layout mode from a nullable string value.
 *
 * On a phone the control layout stacks a full-height playback panel above the
 * rundown, so the schedule a coordinator opened the editor to edit sits below the
 * fold behind the transport controls. Tracking leads with the rundown and keeps
 * playback in a compact bottom bar, which is the layout that actually works there.
 * An explicit ?layout= always wins over this default.
 */
function getEditorLayout(value: string | null, isMobileScreen: boolean): EditorLayoutMode {
  if (isValueOfEnum(EditorLayoutMode, value)) {
    return value;
  }
  return isMobileScreen ? EditorLayoutMode.TRACKING : EditorLayoutMode.CONTROL;
}

export function useEditorLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobileScreen = useIsMobileScreen();
  const layoutMode = getEditorLayout(searchParams.get(layoutParam), isMobileScreen);

  const setLayoutMode = (mode: EditorLayoutMode) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set(layoutParam, mode);
    setSearchParams(nextParams, { replace: true });
  };

  return { layoutMode, setLayoutMode };
}
