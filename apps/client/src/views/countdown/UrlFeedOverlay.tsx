import { FormEvent, useCallback, useEffect, useState } from 'react';
import { IoClose, IoLink } from 'react-icons/io5';

import IconButton from '../../common/components/buttons/IconButton';
import { cx } from '../../common/utils/styleUtils';

import './UrlFeedOverlay.scss';

const STORAGE_KEY = 'ontime-countdown-feed-url';

function readStoredUrl(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredUrl(url: string | null) {
  try {
    if (url) {
      localStorage.setItem(STORAGE_KEY, url);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage may be unavailable (private window, disabled cookies) - the feed still
    // works for the current session, it just will not survive a reload
  }
}

/**
 * Normalises share-style URLs (eg a YouTube watch/share link) to their embeddable form.
 * Anything we do not recognise is passed through unchanged, which covers local tools
 * like FreeShow or ProPresenter's web output that already serve a plain embeddable page.
 */
function toEmbeddableUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (url.hostname.endsWith('youtube.com') && url.pathname === '/watch') {
      const id = url.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    return url.href;
  } catch {
    return rawUrl;
  }
}

function normaliseInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withProtocol).href;
  } catch {
    return null;
  }
}

interface UrlFeedOverlayProps {
  feedUrl: string | null;
  onFeedChange: (url: string | null) => void;
}

/**
 * A hover-revealed control that lets an operator push any URL (FreeShow, ProPresenter's
 * web output, a YouTube video, etc.) onto this screen as a live preview, alongside the
 * countdown clock. Intended for a confidence monitor / second-screen setup where whoever
 * is watching this display also needs to see what the audience-facing output is showing.
 */
function UrlFeedOverlay({ feedUrl, onFeedChange }: UrlFeedOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draftUrl, setDraftUrl] = useState(feedUrl ?? '');

  useEffect(() => {
    const stored = readStoredUrl();
    if (stored && !feedUrl) {
      onFeedChange(stored);
    }
    // only on mount - this restores a previously fed URL after a reload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-hide the box after 5s of no activity (no typing), even while still hovered -
  // keeps it from lingering over the countdown once the operator has stepped away
  useEffect(() => {
    if (!isExpanded) return undefined;
    const timeoutId = window.setTimeout(() => setIsExpanded(false), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [isExpanded, draftUrl]);

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const normalised = normaliseInput(draftUrl);
      if (!normalised) return;
      writeStoredUrl(normalised);
      onFeedChange(normalised);
      setIsExpanded(false);
    },
    [draftUrl, onFeedChange],
  );

  const handleClear = useCallback(() => {
    writeStoredUrl(null);
    onFeedChange(null);
    setDraftUrl('');
    setIsExpanded(false);
  }, [onFeedChange]);

  return (
    <div
      className={cx(['url-feed-overlay', isExpanded && 'url-feed-overlay--expanded'])}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <IconButton
        aria-label='Feed a URL into this screen'
        variant={feedUrl ? 'primary' : 'subtle-white'}
        size='medium'
        className='url-feed-overlay__handle'
      >
        <IoLink />
      </IconButton>

      {isExpanded && (
        <form className='url-feed-overlay__panel' onSubmit={handleSubmit}>
          <input
            type='text'
            className='url-feed-overlay__input'
            placeholder='Paste a URL to show here (FreeShow, ProPresenter output, YouTube...)'
            value={draftUrl}
            onChange={(event) => setDraftUrl(event.target.value)}
            autoFocus
          />
          {feedUrl && (
            <IconButton
              type='button'
              aria-label='Clear feed'
              variant='subtle-destructive'
              size='medium'
              onClick={handleClear}
            >
              <IoClose />
            </IconButton>
          )}
        </form>
      )}
    </div>
  );
}

export default UrlFeedOverlay;

export function FeedFrame({ url }: { url: string }) {
  return (
    <iframe
      className='feed-frame'
      src={toEmbeddableUrl(url)}
      title='Fed content'
      allow='autoplay; encrypted-media; fullscreen'
      allowFullScreen
    />
  );
}
