import { describe, expect, it } from 'vitest';

import { toEmbeddableUrl } from '../UrlFeedOverlay';

describe('toEmbeddableUrl()', () => {
  it('converts a standard watch URL to an embed URL', () => {
    expect(toEmbeddableUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&playsinline=1',
    );
  });

  it('converts a youtu.be share link to an embed URL', () => {
    expect(toEmbeddableUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&playsinline=1',
    );
  });

  it('converts a live stream share link (youtube.com/live/ID) the same way a watch link would - same video ID', () => {
    expect(toEmbeddableUrl('https://www.youtube.com/live/jfKfPfyJRdk')).toBe(
      'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1&playsinline=1',
    );
  });

  it('converts a live stream link with extra query params', () => {
    expect(toEmbeddableUrl('https://www.youtube.com/live/jfKfPfyJRdk?feature=share')).toBe(
      'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1&playsinline=1',
    );
  });

  it('converts a channel live URL to the dedicated live_stream embed form, since there is no single video ID yet', () => {
    expect(toEmbeddableUrl('https://www.youtube.com/channel/UC123abc/live')).toBe(
      'https://www.youtube.com/embed/live_stream?channel=UC123abc&autoplay=1&mute=1&playsinline=1',
    );
  });

  it('passes a FreeShow/ProPresenter-style local URL through unchanged', () => {
    expect(toEmbeddableUrl('http://192.168.1.90:5505/')).toBe('http://192.168.1.90:5505/');
  });

  it('passes an unrecognised youtube.com path through unchanged (eg a @handle/live URL we cannot resolve client-side)', () => {
    expect(toEmbeddableUrl('https://www.youtube.com/@somechannel/live')).toBe(
      'https://www.youtube.com/@somechannel/live',
    );
  });

  it('falls back to the raw input for an unparsable URL instead of throwing', () => {
    expect(toEmbeddableUrl('not a url')).toBe('not a url');
  });
});
