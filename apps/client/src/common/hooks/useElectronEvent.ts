import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';

import { addDialog } from '../stores/dialogStore';

// window.ipcRenderer only exists when preload.js's contextBridge call has
// run, which only happens inside the Electron app - its mere presence is
// the "are we in Electron" signal now that nodeIntegration is off and
// window.process is no longer populated for the renderer (see preload.js).
const isElectron = typeof window.ipcRenderer !== 'undefined';

export function useElectronEvent() {
  const sendToElectron = useCallback((channel: string, args?: string | Record<string, unknown>) => {
    // isElectron is a plain boolean, so it alone doesn't narrow the optional
    // window.ipcRenderer for TypeScript - re-checking the property itself
    // (same truth, since isElectron is derived from it) gets real narrowing.
    if (window.ipcRenderer) {
      window.ipcRenderer.send(channel, args);
    }
  }, []);

  return { isElectron, sendToElectron };
}

export function useElectronListener() {
  const navigate = useNavigate();
  const { isElectron } = useElectronEvent();

  // listen to requests to change the editor location
  useEffect(() => {
    if (window.ipcRenderer) {
      window.ipcRenderer.on('request-editor-location', (_event: unknown, location: string) => {
        navigate(location, { relative: 'route' });
      });

      window.ipcRenderer.on('dialog', (_event: unknown, dialog: string) => {
        if (dialog === 'welcome') {
          addDialog('welcome');
        }
      });
    }

    // Clean the listener after the component is dismounted
    return () => {
      window.ipcRenderer?.removeAllListeners();
    };
  }, [isElectron, navigate]);
}
