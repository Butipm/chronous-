import { KeyboardEvent, useEffect, useState } from 'react';
import { IoClose, IoEye, IoEyeOffOutline } from 'react-icons/io5';

import IconButton from '../../../common/components/buttons/IconButton';
import Input from '../../../common/components/input/input/Input';
import { normaliseInput } from '../../../common/components/url-feed-overlay/UrlFeedOverlay';
import { useFeedUrl } from '../../../common/hooks/useFeedUrl';
import {
  setMessage,
  useExternalMessageInput as useSecondaryMessageInput,
  useTimerMessageInput,
} from '../../../common/hooks/useSocket';
import InputRow from './InputRow';
import TimerControlsPreview from './TimerViewControl';

import style from './InputRow.module.scss';

interface MessageControlProps {
  /** Shares the feed URL with a sibling PlaybackControl when both are rendered together
   *  (the normal combined editor layout). Falls back to its own storage-backed state when
   *  not given, so the standalone /messagecontrol route still works on its own. */
  feedUrl?: string | null;
  onFeedChange?: (url: string | null) => void;
}

export default function MessageControl({ feedUrl: feedUrlProp, onFeedChange: onFeedChangeProp }: MessageControlProps = {}) {
  const [localFeedUrl, setLocalFeedUrl] = useFeedUrl('ontime-editor-feed-url');
  // feedUrlProp can legitimately be null (parent has shared state, but no feed set) - only
  // fall back to local state when the prop was not passed at all (standalone usage)
  const feedUrl = feedUrlProp !== undefined ? feedUrlProp : localFeedUrl;
  const onFeedChange = onFeedChangeProp ?? setLocalFeedUrl;

  return (
    <>
      <TimerControlsPreview />
      <TimerMessageInput />
      <SecondaryInput />
      <FeedUrlInput feedUrl={feedUrl} onFeedChange={onFeedChange} />
    </>
  );
}

function TimerMessageInput() {
  const { text, visible } = useTimerMessageInput();

  return (
    <InputRow
      label='Timer Message'
      placeholder='Message shown fullscreen in stage timer'
      text={text}
      visible={visible}
      changeHandler={(newValue) => setMessage.timerText(newValue)}
    >
      <IconButton
        aria-label='Toggle timer message visibility'
        onClick={() => setMessage.timerVisible(!visible)}
        variant={visible ? 'primary' : 'subtle'}
      >
        {visible ? <IoEye /> : <IoEyeOffOutline />}
      </IconButton>
    </InputRow>
  );
}

function SecondaryInput() {
  const { text, visible } = useSecondaryMessageInput();

  const toggleSecondary = () => {
    if (visible) {
      setMessage.timerSecondarySource(null);
    } else {
      setMessage.timerSecondarySource('secondary');
    }
  };

  return (
    <InputRow
      label='Secondary Message'
      placeholder='Message shown as secondary text in stage timer'
      text={text}
      visible={visible}
      changeHandler={(newValue) => setMessage.secondaryMessage(newValue)}
    >
      <IconButton
        aria-label='Toggle secondary message visibility'
        onClick={toggleSecondary}
        variant={visible ? 'primary' : 'subtle'}
      >
        {visible ? <IoEye /> : <IoEyeOffOutline />}
      </IconButton>
    </InputRow>
  );
}

interface FeedUrlInputProps {
  feedUrl: string | null;
  onFeedChange: (url: string | null) => void;
}

/**
 * A plain, always-visible counterpart to PlaybackControl's click-to-reveal Feed preview
 * trigger - same underlying feed (shared via the 'ontime-editor-feed-url' storage key /
 * lifted state), just surfaced as an ordinary labeled field here since that is where an
 * operator scanning this panel for "where do I put a URL" naturally looks, next to the other
 * two message fields. Commits on blur or Enter rather than on every keystroke, so a URL being
 * typed is not reparsed (and rejected) one character at a time.
 */
function FeedUrlInput({ feedUrl, onFeedChange }: FeedUrlInputProps) {
  const [draft, setDraft] = useState(feedUrl ?? '');

  // keep the draft in sync when the feed changes elsewhere (eg the Feed preview trigger)
  useEffect(() => {
    setDraft(feedUrl ?? '');
  }, [feedUrl]);

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      onFeedChange(null);
      return;
    }
    const normalised = normaliseInput(trimmed);
    if (normalised) {
      onFeedChange(normalised);
      setDraft(normalised);
    }
    // an unparseable value is left in the field uncommitted rather than silently reverted,
    // so the operator can see and fix what they typed
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
      event.currentTarget.blur();
    }
  };

  const handleClear = () => {
    onFeedChange(null);
    setDraft('');
  };

  return (
    <div>
      <label className={style.label} htmlFor='feed-url'>
        Feed URL
      </label>
      <div className={style.inputItems}>
        <Input
          id='feed-url'
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          placeholder='Paste a URL to show in Feed preview (FreeShow, ProPresenter output, YouTube...)'
        />
        {feedUrl && (
          <IconButton aria-label='Clear feed URL' onClick={handleClear} variant='subtle-destructive'>
            <IoClose />
          </IconButton>
        )}
      </div>
    </div>
  );
}
