import { useEffect, useRef } from 'react';

import { cx } from '../../utils/styleUtils';

import {
  isStalled,
  loadYoutubeApi,
  parseYoutubeVideoId,
  type PlaybackSample,
  type YoutubePlayer,
} from './youtubePlayer';

const WATCHDOG_INTERVAL_MS = 1500;
/** Nudges before we give up on the current stream and reload the video from scratch */
const MAX_NUDGES = 3;
const RESUME_DELAY_MS = 250;

function mountIframeFallback(container: HTMLElement, url: string) {
  const frame = document.createElement('iframe');
  frame.src = url;
  frame.title = 'Fed content';
  frame.allow = 'autoplay; encrypted-media; fullscreen';
  frame.allowFullscreen = true;
  container.appendChild(frame);
}

/**
 * YouTube playback through the IFrame Player API rather than a bare <iframe>.
 *
 * A live stream can wedge: the player keeps reporting PLAYING while the playhead
 * stops moving and the audio stops with it. A plain embed cannot be inspected
 * cross-origin, so the only recovery was an operator manually toggling play/pause.
 * Here a watchdog samples the playhead and performs that same toggle itself.
 *
 * Falls back to a plain iframe if the API cannot load or the URL has no video id
 * (eg the channel-level live_stream form), so this component never renders blank.
 */
export default function YoutubeFeedPlayer({ url, className }: { url: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const videoId = parseYoutubeVideoId(url);
    if (!videoId) {
      mountIframeFallback(container, url);
      return () => {
        container.replaceChildren();
      };
    }

    let disposed = false;
    let player: YoutubePlayer | null = null;
    let watchdog: number | undefined;
    let resumeTimer: number | undefined;

    // Last sample the playhead was actually seen moving, not merely the last sample.
    let lastProgress: PlaybackSample | null = null;
    let nudges = 0;

    const nudge = () => {
      if (!player) return;
      if (nudges >= MAX_NUDGES) {
        // Repeated nudges did not recover it - restart the stream instead.
        player.loadVideoById(videoId);
        nudges = 0;
        return;
      }
      nudges += 1;
      player.pauseVideo();
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        if (!disposed) player?.playVideo();
      }, RESUME_DELAY_MS);
    };

    const mountDiv = document.createElement('div');
    container.appendChild(mountDiv);

    loadYoutubeApi()
      .then((YT) => {
        if (disposed) return;
        player = new YT.Player(mountDiv, {
          videoId,
          playerVars: {
            autoplay: 1,
            mute: 1,
            playsinline: 1,
            controls: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: () => player?.playVideo(),
          },
        });

        watchdog = window.setInterval(() => {
          if (!player || typeof player.getCurrentTime !== 'function') return;
          const sample: PlaybackSample = {
            time: player.getCurrentTime(),
            state: player.getPlayerState(),
            at: Date.now(),
          };

          if (lastProgress && Math.abs(sample.time - lastProgress.time) > 0.1) {
            lastProgress = sample;
            nudges = 0;
            return;
          }

          if (isStalled(lastProgress, sample)) {
            nudge();
            // Restart the window so one stall does not fire the watchdog every tick.
            lastProgress = sample;
            return;
          }

          if (!lastProgress) lastProgress = sample;
        }, WATCHDOG_INTERVAL_MS);
      })
      .catch(() => {
        if (disposed || !container) return;
        container.replaceChildren();
        mountIframeFallback(container, url);
      });

    return () => {
      disposed = true;
      window.clearInterval(watchdog);
      window.clearTimeout(resumeTimer);
      try {
        player?.destroy();
      } catch {
        // the API throws if it was already torn down by a page navigation
      }
      container.replaceChildren();
    };
  }, [url]);

  return <div ref={containerRef} className={cx(['feed-frame', className])} />;
}
