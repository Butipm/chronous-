import { Tooltip } from '@base-ui/react/tooltip';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PropsWithChildren } from 'react';
import { BrowserRouter, useLocation } from 'react-router';

// apply global axios config defaults
import './common/api/axios.config';
import AppRouter from './AppRouter';
import ErrorBoundary from './common/components/error-boundary/ErrorBoundary';
import IdentifyOverlay from './common/components/identify-overlay/IdentifyOverlay';
import { AppContextProvider } from './common/context/AppContext';
import { ontimeQueryClient } from './common/queryClient';
import { connectSocket } from './common/utils/socket';
import { baseURI } from './externals';
import KeepAwake from './features/keep-awake/KeepAwake';
import { TranslationProvider } from './translation/TranslationProvider';

connectSocket();

// Output views (timer, countdown, backstage, studio, timeline, info) are meant to fill exactly
// one screen with nothing below the fold - .App's overflow:hidden is correct there. Everything
// else is a controller/editing surface whose content height depends on how many events/timers/
// groups exist, and which can be opened on a phone where the visible viewport is much shorter
// than desktop testing assumes - those need to actually be able to scroll. See index.scss.
const OUTPUT_ROUTE_PREFIXES = ['/timer', '/countdown', '/backstage', '/studio', '/timeline', '/info'];

function isOutputRoute(pathname: string): boolean {
  return OUTPUT_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function AppShell({ children }: PropsWithChildren) {
  const { pathname } = useLocation();
  const className = isOutputRoute(pathname) ? 'App' : 'App App--scrollable';

  return <div className={className}>{children}</div>;
}

function App() {
  return (
    <QueryClientProvider client={ontimeQueryClient}>
      <AppContextProvider>
        <Tooltip.Provider>
          <BrowserRouter basename={baseURI}>
            <AppShell>
              <ErrorBoundary>
                <TranslationProvider>
                  <IdentifyOverlay />
                  <KeepAwake />
                  <AppRouter />
                </TranslationProvider>
              </ErrorBoundary>
              <ReactQueryDevtools initialIsOpen={false} />
            </AppShell>
            <ErrorBoundary>
              <div id='identify-portal' />
            </ErrorBoundary>
          </BrowserRouter>
        </Tooltip.Provider>
      </AppContextProvider>
    </QueryClientProvider>
  );
}

export default App;
