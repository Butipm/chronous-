import { validateMessage, validateTimerMessage } from '../message.utils.js';

describe('validateMessage()', () => {
  it('returns a valid Message object', () => {
    expect(validateMessage('test')).toEqual('test');
  });
});

describe('validateTimerMessage()', () => {
  it('returns a valid Timer Message object', () => {
    const payload = {
      text: '12312',
      visible: 'true',
      blink: 'true',
      blackout: 'true',
    };
    const expected = {
      text: '12312',
      visible: true,
      blink: true,
      blackout: true,
    };

    expect(validateTimerMessage(payload)).toEqual(expected);
  });
  it('skips keys not given', () => {
    const payload = {
      visible: 'true',
    };
    const expected = {
      visible: true,
    };

    expect(validateTimerMessage(payload)).toStrictEqual(expected);
  });
  it('accepts a feed URL string', () => {
    const payload = {
      feedUrl: 'https://example.com',
    };
    const expected = {
      feedUrl: 'https://example.com',
    };

    expect(validateTimerMessage(payload)).toStrictEqual(expected);
  });
  it('accepts null to clear the feed URL', () => {
    const payload = {
      feedUrl: null,
    };
    const expected = {
      feedUrl: null,
    };

    expect(validateTimerMessage(payload)).toStrictEqual(expected);
  });
});
