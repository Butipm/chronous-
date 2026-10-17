declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// IPC listener callback: (event, ...whatever args the sender passed). The
// previous `(event: 'string', args: unknown[])` signature never actually
// matched any real call site (they all destructure a single typed value as
// the second param, not an array) - it went unchecked before because
// window.require('electron').ipcRenderer bypassed this declared type
// entirely, picking up Electron's own IpcRenderer type instead.
type ListenerType = ( event: unknown, ...args: any[] ) => void;

declare global {
  /**
   * Exposed by preload.js via contextBridge (contextIsolation: true) - only
   * present in the Electron app, undefined in a plain browser tab. Its mere
   * existence is the "are we in Electron" check used throughout the client
   * (see useElectronEvent.ts's isElectron) - window.process is no longer
   * populated for the renderer now that nodeIntegration is off, so it's not
   * declared here anymore.
   */
  interface Window {
    ipcRenderer?: {
      send: (channel: string, args?: string | object) => void;
      on: (channel: string, listener: ListenerType) => void;
      removeAllListeners: (channel?: string) => void;
    };
    // Experimental browser feature
    documentPictureInPicture: {
      requestWindow: () => Promise<Window>;
      window: Window;
    };
  }
}

/**
 * Allow passing CSS Properties
 */
declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }

  namespace JSX {
    interface IntrinsicElements {
      // Electron's <webview> tag (only valid when the main process enabled
      // webviewTag: true) - not a standard HTML element, so React/TS don't
      // know about it by default. Only the attributes FeedFrame actually
      // uses are declared; this isn't meant to be a complete Electron.
      // WebviewTag surface. See UrlFeedOverlay.tsx's FeedFrame.
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        allowpopups?: boolean;
      };
    }
  }
}

export default {};
