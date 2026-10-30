import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { IoClose, IoLink } from 'react-icons/io5';

import IconButton from '../buttons/IconButton';
import { cx } from '../../utils/styleUtils';
import YoutubeFeedPlayer from './YoutubeFeedPlayer';
import { parseYoutubeVideoId } from './youtubePlayer';

import './UrlFeedOverlay.scss';

function readStoredUrl(storageKey: string): string | null {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function writeStoredUrl(storageKey: string, url: string | null) {
  try {
    if (url) {
      localStorage.setItem(storageKey, url);
    } else {
      localStorage.removeItem(storageKey);
    }
  } catch {
    // Storage may be unavailable (private window, disabled cookies) - the feed still
    // works for the current session, it just will not survive a reload
  }
}

/**
 * Builds a YouTube embed URL that actually autoplays. Browsers only allow autoplay when
 * the video starts muted (no exceptions for an iframe's allow="autoplay" attribute alone) -
 * operators who want sound can unmute from the player's own controls. playsinline stops a
 * mobile browser from hijacking it into a native fullscreen player instead of playing in
 * place. This works the same for a live stream's video ID as for an uploaded video - YouTube
 * detects it is live server-side, there is no separate "live" embed param needed.
 */
function toYoutubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1`;
}

/**
 * Normalises share-style URLs (eg a YouTube watch/share link) to their embeddable form.
 * Anything we do not recognise is passed through unchanged, which covers local tools
 * like FreeShow or ProPresenter's web output that already serve a plain embeddable page.
 */
export function toEmbeddableUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.slice(1);
      if (id) return toYoutubeEmbedUrl(id);
    }
    if (url.hostname.endsWith('youtube.com')) {
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v');
        if (id) return toYoutubeEmbedUrl(id);
      }
      // live stream share links look like youtube.com/live/VIDEO_ID - same video ID,
      // just a different path, so the same /embed/ form plays it
      const liveVideoMatch = url.pathname.match(/^\/live\/([^/?]+)/);
      if (liveVideoMatch) return toYoutubeEmbedUrl(liveVideoMatch[1]);
      // "watch whatever this channel is currently streaming" - youtube.com/channel/ID/live -
      // YouTube has a dedicated embed form for this since there is no single video ID to
      // resolve to until the stream starts. A @handle/live URL cannot be resolved the same
      // way without a YouTube Data API lookup, so it is left as an unrecognised passthrough.
      const channelLiveMatch = url.pathname.match(/^\/channel\/([^/]+)\/live/);
      if (channelLiveMatch) {
        return `https://www.youtube.com/embed/live_stream?channel=${channelLiveMatch[1]}&autoplay=1&mute=1&playsinline=1`;
      }
    }
    return url.href;
  } catch {
    return rawUrl;
  }
}

export function normaliseInput(value: string): string | null {
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
  /** Keeps each view's fed URL independent (eg Timer and Countdown remember their own) across
   *  a reload. Omit it when feedUrl is already persisted elsewhere (eg broadcast server state,
   *  which survives a reload on its own) - restoring from a stale local copy on top of that
   *  would fight the real source of truth. */
  storageKey?: string;
  className?: string;
  /** Shrinks the trigger icon - useful once a feed is active and every pixel above it counts */
  size?: 'small' | 'medium';
}

/**
 * A click-revealed control that lets an operator push any URL (FreeShow, ProPresenter's
 * web output, a YouTube video, etc.) onto this screen as a live preview, alongside the
 * running timer/clock. Intended for a confidence monitor / second-screen setup where
 * whoever is watching this display also needs to see what the audience-facing output is
 * showing - feed it FreeShow, ProPresenter, or a video, and whoever's looking sees both
 * the time and the content at once.
 *
 * Click, not hover, opens the box: hover reveal was fragile in practice - moving the
 * mouse from the icon down into the input crossed a dead zone (the gap between them) that
 * fired mouseleave and unmounted the box before a click or keystroke could land there, and
 * re-hovering the icon after a click often did not fire a fresh mouseenter at all if the
 * pointer had not actually moved since the click. A click is a discrete event regardless of
 * where the pointer has been, so it does not have either problem.
 */
export default function UrlFeedOverlay({ feedUrl, onFeedChange, storageKey, className, size = 'medium' }: UrlFeedOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draftUrl, setDraftUrl] = useState(feedUrl ?? '');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!storageKey) return;
    const stored = readStoredUrl(storageKey);
    if (stored && !feedUrl) {
      onFeedChange(stored);
    }
    // only on mount - this restores a previously fed URL after a reload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-hide the box after 5s of no activity (no typing) - keeps it from lingering over
  // the view once the operator has stepped away, without needing them to keep hovering it
  useEffect(() => {
    if (!isExpanded) return undefined;
    const timeoutId = window.setTimeout(() => setIsExpanded(false), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [isExpanded, draftUrl]);

  // close on a click outside the box, and on Escape - standard dropdown behaviour
  useEffect(() => {
    if (!isExpanded) return undefined;
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsExpanded(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const normalised = normaliseInput(draftUrl);
      if (!normalised) return;
      if (storageKey) writeStoredUrl(storageKey, normalised);
      onFeedChange(normalised);
      setIsExpanded(false);
    },
    [draftUrl, onFeedChange, storageKey],
  );

  const handleClear = useCallback(() => {
    if (storageKey) writeStoredUrl(storageKey, null);
    onFeedChange(null);
    setDraftUrl('');
    setIsExpanded(false);
  }, [onFeedChange, storageKey]);

  return (
    <div ref={containerRef} className={cx(['url-feed-overlay', isExpanded && 'url-feed-overlay--expanded', className])}>
      <IconButton
        type='button'
        aria-label={feedUrl ? 'Stop showing fed content' : 'Feed a URL into this screen'}
        title={feedUrl ? 'Click to stop showing the fed URL' : undefined}
        variant={feedUrl ? 'primary' : 'subtle-white'}
        size={size}
        className='url-feed-overlay__handle'
        onClick={() => {
          if (feedUrl) {
            handleClear();
          } else {
            setIsExpanded((current) => !current);
          }
        }}
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

// Electron only (webviewTag: true in main.js's webPreferences) - window.ipcRenderer's
// presence is the same Electron-detection signal used throughout the client,
// see useElectronEvent.ts. A plain <iframe> can't be made to show most real
// websites (X-Frame-Options/CSP frame-ancestors is a hard browser security
// boundary, not something fixable client-side); <webview> runs the fed page
// in its own separate process/guest frame instead of embedding it in this
// page's DOM, which isn't subject to that same restriction. Only available
// in the desktop app - the browser/phone QR-remote-control case still gets
// the iframe below, same restriction as before.
const isElectron = typeof window.ipcRenderer !== 'undefined';

export function FeedFrame({ url, className }: { url: string; className?: string }) {
  const embeddableUrl = toEmbeddableUrl(url);

  if (isElectron) {
    return <webview className={cx(['feed-frame', className])} src={embeddableUrl} allowpopups />;
  }

  // YouTube gets the API player so a stalled live stream can be nudged back to
  // life; anything else stays a plain iframe. See YoutubeFeedPlayer.
  if (parseYoutubeVideoId(embeddableUrl)) {
    return <YoutubeFeedPlayer url={embeddableUrl} className={className} />;
  }

  return (
    <iframe
      className={cx(['feed-frame', className])}
      src={embeddableUrl}
      title='Fed content'
      allow='autoplay; encrypted-media; fullscreen'
      allowFullScreen
    />
  );
}
