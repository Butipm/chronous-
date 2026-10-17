import { useState } from 'react';

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
 * Local, localStorage-backed feed-URL state for a given key. Lets several components that
 * share a storageKey (eg PlaybackControl's UrlFeedOverlay trigger and MessageControl's plain
 * input, both keyed on 'ontime-editor-feed-url') stay in sync when rendered together, while
 * still working standalone (eg the extracted /timercontrol or /messagecontrol routes) since
 * each reads the same persisted value independently on mount.
 */
export function useFeedUrl(storageKey: string): [string | null, (url: string | null) => void] {
  const [feedUrl, setFeedUrlState] = useState<string | null>(() => readStoredUrl(storageKey));

  const setFeedUrl = (url: string | null) => {
    writeStoredUrl(storageKey, url);
    setFeedUrlState(url);
  };

  return [feedUrl, setFeedUrl];
}
