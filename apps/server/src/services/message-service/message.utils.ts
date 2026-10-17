import { TimerMessage } from 'ontime-types';

import * as assert from '../../utils/assert.js';
import { coerceBoolean, coerceString } from '../../utils/coerceType.js';

/**
 * Creates a valid Message object from a payload
 * @throws if the payload is not an object
 */
export function validateMessage(message: unknown): string {
  return decodeURI(coerceString(message));
}

/**
 * Creates a valid Timer Message object from a payload
 * @throws if the payload is not an object
 */
export function validateTimerMessage(message: unknown): Partial<TimerMessage> {
  assert.isObject(message);

  const result: Partial<TimerMessage> = {};

  if ('text' in message) result.text = decodeURI(coerceString(message.text));
  if ('visible' in message) result.visible = coerceBoolean(message.visible);
  if ('blink' in message) result.blink = coerceBoolean(message.blink);
  if ('blackout' in message) result.blackout = coerceBoolean(message.blackout);
  if ('secondarySource' in message) result.secondarySource = coerceSecondary(message.secondarySource);
  if ('feedUrl' in message) result.feedUrl = coerceFeedUrl(message.feedUrl);

  return result;
}

/**
 * Ensures the feed URL is either a string or explicitly null (clearing it) - free-form like
 * the other message fields, no URL-format enforcement here (the client already normalises
 * what it sends; other integrations setting this are trusted the same way they are for text)
 */
function coerceFeedUrl(value: unknown): string | null {
  if (value === null) {
    return null;
  }
  return decodeURI(coerceString(value));
}

/**
 * Asserts that the secondary value is one of the permitted values
 */
function assertSecondary(source: unknown): source is TimerMessage['secondarySource'] {
  return source === 'aux1' || source === 'aux2' || source === 'aux3' || source === 'secondary' || source === null;
}

/**
 * Ensures that the secondary value is one of the permitted values
 */
function coerceSecondary(source: unknown): TimerMessage['secondarySource'] {
  if (!assertSecondary(source)) {
    return null;
  }
  return source;
}
