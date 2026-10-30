/**
 * Minimal glue for the YouTube IFrame Player API.
 *
 * The plain <iframe> embed gives us no visibility into playback: when a live stream
 * stalls it just sits there, and the only fix is the operator noticing and toggling
 * play/pause. With the API we can watch the playhead and do that nudge ourselves.
 */

/** The slice of YT.Player this app actually uses. */
export interface YoutubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (videoId: string) => void;
  getPlayerState: () => number;
  getCurrentTime: () => number;
  destroy: () => void;
}

interface YoutubeApi {
  Player: new (element: HTMLElement, options: Record<string, unknown>) => YoutubePlayer;
}

declare global {
  interface Window {
    YT?: YoutubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export const YT_PLAYING = 1;
export const YT_BUFFERING = 3;

let apiPromise: Promise<YoutubeApi> | null = null;

/**
 * Loads the IFrame API once per document, however many players ask for it.
 * The API signals readiness through a single global callback, so every caller
 * chains onto it rather than overwriting it.
 */
export function loadYoutubeApi(): Promise<YoutubeApi> {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YoutubeApi>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    const settle = () => {
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error('YouTube IFrame API loaded without a Player constructor'));
    };

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      settle();
    };

    if (!document.getElementById('youtube-iframe-api')) {
      const script = document.createElement('script');
      script.id = 'youtube-iframe-api';
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => reject(new Error('Failed to load the YouTube IFrame API'));
      document.head.appendChild(script);
    }

    // The API normally calls onYouTubeIframeAPIReady; if the script was already
    // in flight before this component mounted, that callback has been consumed
    // by another listener, so fall back to polling rather than hanging forever.
    const started = Date.now();
    const poll = window.setInterval(() => {
      if (window.YT?.Player) {
        window.clearInterval(poll);
        settle();
      } else if (Date.now() - started > 10000) {
        window.clearInterval(poll);
        reject(new Error('Timed out loading the YouTube IFrame API'));
      }
    }, 250);
  });

  return apiPromise;
}

/**
 * Pulls a concrete video id out of an embeddable YouTube URL.
 *
 * Returns null for the channel live_stream form (there is no video id until the
 * stream starts) and for anything that is not a YouTube embed, in which case the
 * caller keeps the plain iframe and gives up stall recovery.
 */
export function parseYoutubeVideoId(embeddableUrl: string): string | null {
  try {
    const url = new URL(embeddableUrl);
    if (!url.hostname.endsWith('youtube.com')) return null;
    const match = url.pathname.match(/^\/embed\/([^/]+)/);
    if (!match) return null;
    const videoId = match[1];
    if (videoId === 'live_stream') return null;
    return videoId;
  } catch {
    return null;
  }
}

export interface PlaybackSample {
  /** Playhead position in seconds */
  time: number;
  /** YT.PlayerState */
  state: number;
  /** Wall-clock milliseconds when this sample was taken */
  at: number;
}

/** How long the playhead has to stand still before we treat playback as stalled. */
export const STALL_THRESHOLD_MS = 5000;

/**
 * True when the player claims to be playing or buffering but the playhead has not
 * moved between two samples. That is the state a live stream wedges in: the player
 * still reports PLAYING, so nothing on its own ever notices or recovers.
 */
export function isStalled(previous: PlaybackSample | null, current: PlaybackSample): boolean {
  if (!previous) return false;
  if (current.state !== YT_PLAYING && current.state !== YT_BUFFERING) return false;
  if (current.at - previous.at < STALL_THRESHOLD_MS) return false;
  return Math.abs(current.time - previous.time) < 0.1;
}
