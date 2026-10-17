import { useQuery } from '@tanstack/react-query';
import { dayInMs } from 'ontime-utils';

import { APP_VERSION } from '../api/constants';
import { HasUpdate, getLatestVersion } from '../api/external';

const placeholder: HasUpdate & { hasUpdates: boolean } = { url: '', version: '', hasUpdates: false };

export default function useAppVersion() {
  const {
    data: fetchData,
    status,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: APP_VERSION,
    queryFn: ({ signal }) => getLatestVersion({ signal }),
    placeholderData: (previousData, _previousQuery) => previousData,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    staleTime: dayInMs,
    // getLatestVersion() checks Ontime's own GitHub releases, not a
    // Chronous-specific feed - comparing this fork's version against
    // upstream's independent release cadence is meaningless (it would
    // perpetually report "update available" against a project this isn't
    // actually tracking release-for-release). Disabled until Chronous has
    // its own release feed to check against instead.
    enabled: false,
  });

  const data = fetchData ? { ...fetchData, hasUpdates: false } : placeholder;

  return { data, placeholder, status, isFetching, isError, refetch };
}
