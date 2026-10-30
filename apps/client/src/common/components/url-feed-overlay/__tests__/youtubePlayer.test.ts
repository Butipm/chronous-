import { describe, expect, it } from 'vitest';

import {
  isStalled,
  parseYoutubeVideoId,
  STALL_THRESHOLD_MS,
  YT_BUFFERING,
  YT_PLAYING,
  type PlaybackSample,
} from '../youtubePlayer';

const sample = (time: number, state: number, at: number): PlaybackSample => ({ time, state, at });

describe('parseYoutubeVideoId()', () => {
  it('reads the id out of an embed URL the overlay produces', () => {
    expect(
      parseYoutubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&playsinline=1'),
    ).toBe('dQw4w9WgXcQ');
  });

  it('reads the id out of a live stream embed', () => {
    expect(parseYoutubeVideoId('https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1')).toBe(
      'jfKfPfyJRdk',
    );
  });

  it('returns null for the channel live_stream form, which has no video id until the stream starts', () => {
    expect(parseYoutubeVideoId('https://www.youtube.com/embed/live_stream?channel=UC123&autoplay=1')).toBeNull();
  });

  it('returns null for non-YouTube feeds so they keep the plain iframe', () => {
    expect(parseYoutubeVideoId('http://192.168.1.50:8080/output')).toBeNull();
    expect(parseYoutubeVideoId('https://vimeo.com/12345')).toBeNull();
  });

  it('returns null rather than throwing on a malformed URL', () => {
    expect(parseYoutubeVideoId('not a url')).toBeNull();
  });
});

describe('isStalled()', () => {
  it('does not report a stall on the first sample', () => {
    expect(isStalled(null, sample(10, YT_PLAYING, 0))).toBe(false);
  });

  it('reports a stall when the playhead has not moved for the threshold while playing', () => {
    const previous = sample(10, YT_PLAYING, 1000);
    const current = sample(10, YT_PLAYING, 1000 + STALL_THRESHOLD_MS);
    expect(isStalled(previous, current)).toBe(true);
  });

  it('treats a wedged buffering player the same as a wedged playing one', () => {
    const previous = sample(10, YT_BUFFERING, 1000);
    const current = sample(10, YT_BUFFERING, 1000 + STALL_THRESHOLD_MS);
    expect(isStalled(previous, current)).toBe(true);
  });

  it('does not report a stall while the playhead is advancing', () => {
    const previous = sample(10, YT_PLAYING, 1000);
    const current = sample(15, YT_PLAYING, 1000 + STALL_THRESHOLD_MS);
    expect(isStalled(previous, current)).toBe(false);
  });

  it('does not report a stall before the threshold has elapsed', () => {
    const previous = sample(10, YT_PLAYING, 1000);
    const current = sample(10, YT_PLAYING, 1000 + STALL_THRESHOLD_MS - 1);
    expect(isStalled(previous, current)).toBe(false);
  });

  it('ignores a paused player - a stationary playhead is expected there', () => {
    const previous = sample(10, 2, 1000);
    const current = sample(10, 2, 1000 + STALL_THRESHOLD_MS * 4);
    expect(isStalled(previous, current)).toBe(false);
  });

  it('ignores an unstarted player', () => {
    const previous = sample(0, -1, 1000);
    const current = sample(0, -1, 1000 + STALL_THRESHOLD_MS * 4);
    expect(isStalled(previous, current)).toBe(false);
  });
});
