/**
 * This file contains a list of constants that may need to be resolved at runtime
 */

import { version } from '../../../package.json';
import { resolveBaseURI, resolveUrl } from './externals.utils';

// Kept only because useAppVersion.ts's query is disabled, not removed (see
// its own comment) - this would otherwise compare Chronous's version
// against upstream Ontime's independent release cadence, which is
// meaningless now that the two are separate projects.
export const apiRepoLatest = 'https://api.github.com/repos/cpvalente/ontime/releases/latest';

// resolve environment
export const appVersion = version;
export const isDocker = import.meta.env.IS_DOCKER; // this env is made available by the vite.config.js define function
export const isProduction = import.meta.env.PROD;
export const isDev = import.meta.env.DEV;
export const currentHostName = window.location.hostname;
export const isLocalhost = currentHostName === 'localhost' || currentHostName === '127.0.0.1';
export const isOntimeCloud = document.querySelector('base')?.hasAttribute('data-is-cloud');

export const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
export const supportsFullscreen = document.fullscreenEnabled;

// resolve entrypoint URLs
export const baseURI = resolveBaseURI(document.querySelector('base')?.getAttribute('href'));
export const serverURL = resolveUrl(window.location, baseURI, 'http', '');
export const websocketUrl = resolveUrl(window.location, baseURI, 'ws', 'ws');

/**
 * Resolves a session scope for the session
 */
export const sessionScope = resolveSessionScope();
export const getIsNavigationLocked = () => new URLSearchParams(window.location.search).get('n') === '1';

/**
 * The session scope is read from the cookie and will only exist if the app is password protected
 */
function resolveSessionScope() {
  const tokenCookie = document.cookie.split('; ').find((cookie) => cookie.startsWith('token='));

  if (tokenCookie) {
    try {
      const { scope } = JSON.parse(tokenCookie.split('=')[1]);
      return scope;
    } catch {
      return 'rw';
    }
  }
  return 'rw';
}
