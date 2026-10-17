import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toolbar } from '@base-ui/react/toolbar';
import { OffsetMode, SupportedEntry } from 'ontime-types';
import { memo } from 'react';
import { IoAdd } from 'react-icons/io5';

import Button from '../../../common/components/buttons/Button';
import Tooltip from '../../../common/components/tooltip/Tooltip';
import { useEntryActionsContext } from '../../../common/context/EntryActionsContext';
import useRundown from '../../../common/hooks-query/useRundown';
import { setOffsetMode, useOffsetMode } from '../../../common/hooks/useSocket';
import { AppMode } from '../../../ontimeConfig';
import { EditorLayoutMode, useEditorLayout } from '../../../views/editor/useEditorLayout';
import { RundownViewMode } from '../rundown.options';
import { useEditorFollowMode } from '../useEditorFollowMode';
import RundownMenu from './RundownMenu';

import style from './RundownHeader.module.scss';

interface RundownHeaderProps {
  isExtracted?: boolean;
  viewMode: RundownViewMode;
  setViewMode: (mode: RundownViewMode) => void;
}

interface HeaderControlsConfig {
  showRunEditToggle: boolean;
  showOffsetToggle: boolean;
  showOverflowMenu: boolean;
}

export const HEADER_CONTROLS_CONFIG: Record<EditorLayoutMode, HeaderControlsConfig> = {
  [EditorLayoutMode.CONTROL]: {
    showRunEditToggle: true,
    showOffsetToggle: true,
    showOverflowMenu: true,
  },
  [EditorLayoutMode.PLANNING]: {
    showRunEditToggle: false,
    showOffsetToggle: false,
    showOverflowMenu: true,
  },
  [EditorLayoutMode.TRACKING]: {
    showRunEditToggle: false,
    showOffsetToggle: true,
    showOverflowMenu: false,
  },
} as const;

export default memo(RundownHeader);
function RundownHeader({ isExtracted, viewMode, setViewMode }: RundownHeaderProps) {
  const { editorMode, setEditorMode } = useEditorFollowMode();
  const offsetMode = useOffsetMode();
  const { layoutMode } = useEditorLayout();
  const { addEntry } = useEntryActionsContext();
  const { data: rundown } = useRundown();

  const { showRunEditToggle, showOffsetToggle, showOverflowMenu } = HEADER_CONTROLS_CONFIG[layoutMode];

  // always reachable, regardless of Run/Edit - adding an event does not carry the same
  // "break a live show" risk as reordering or deleting one, and this was the single most
  // reported piece of friction: the + Event/Delay/Milestone toolbar only ever shows once
  // you are in Edit mode and have a group expanded, which is not obvious at a glance.
  const addEventAtEnd = () => {
    const lastId = rundown.order.at(-1) ?? null;
    addEntry(
      { type: SupportedEntry.Event, parent: null },
      lastId ? { after: lastId, lastEventId: lastId } : undefined,
    );
  };

  const toggleAppMode = (mode: AppMode[]) => {
    // we need to stop user from deselecting a mode
    const newValue = mode.at(0);
    if (!newValue) return;
    setEditorMode(newValue);
  };

  const toggleViewMode = (mode: RundownViewMode[]) => {
    const newValue = mode.at(0);
    if (!newValue) return;
    setViewMode(newValue);
  };

  const toggleOffsetMode = (mode: OffsetMode[]) => {
    const newValue = mode.at(0);
    if (!newValue) return;
    setOffsetMode(newValue);
  };

  return (
    <Toolbar.Root className={style.header}>
      {showRunEditToggle && (
        <ToggleGroup value={[editorMode]} onValueChange={toggleAppMode} className={style.group}>
          <Tooltip
            text='Live playback view with auto-follow'
            render={<Toolbar.Button render={<Toggle />} value={AppMode.Run} className={style.radioButton} />}
          >
            Run
          </Tooltip>
          <Tooltip
            text='Manual editing without playback automation'
            render={<Toolbar.Button render={<Toggle />} value={AppMode.Edit} className={style.radioButton} />}
          >
            Edit
          </Tooltip>
        </ToggleGroup>
      )}

      <ToggleGroup value={[viewMode]} onValueChange={toggleViewMode} className={style.group}>
        <Tooltip
          text='View rundown in list mode'
          render={<Toolbar.Button render={<Toggle />} value={RundownViewMode.List} className={style.radioButton} />}
        >
          List
        </Tooltip>
        <Tooltip
          text='View rundown in table mode'
          render={<Toolbar.Button render={<Toggle />} value={RundownViewMode.Table} className={style.radioButton} />}
        >
          Table
        </Tooltip>
      </ToggleGroup>

      {showOffsetToggle && (
        <ToggleGroup value={[offsetMode]} onValueChange={toggleOffsetMode} className={style.group}>
          <Tooltip
            text='Offsets use fixed clock time'
            render={<Toolbar.Button render={<Toggle />} value={OffsetMode.Absolute} className={style.radioButton} />}
          >
            Absolute
          </Tooltip>
          <Tooltip
            text='Offsets follow the rundown relative start'
            render={<Toolbar.Button render={<Toggle />} value={OffsetMode.Relative} className={style.radioButton} />}
          >
            Relative
          </Tooltip>
        </ToggleGroup>
      )}

      <Tooltip
        text='Add a new event to the end of the rundown'
        render={<Toolbar.Button render={<Button size='small' variant='subtle' />} onClick={addEventAtEnd} />}
      >
        <IoAdd />
        Add event
      </Tooltip>

      {showOverflowMenu && <RundownMenu allowNavigation={!isExtracted} />}
    </Toolbar.Root>
  );
}
