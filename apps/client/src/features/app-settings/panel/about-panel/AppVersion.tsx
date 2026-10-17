import useAppVersion from '../../../../common/hooks-query/useAppVersion';
import { appVersion } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

import style from './AppVersion.module.scss';

export default function AppVersion() {
  const { data, isError } = useAppVersion();

  if (isError) {
    return (
      <Panel.ListItem>
        <Panel.Field title={`Chronous ${appVersion}`} description='' error='Could not fetch version information' />
      </Panel.ListItem>
    );
  }

  if (data.hasUpdates) {
    return (
      <Panel.ListItem>
        <Panel.Field
          title={
            <>
              <span className={style.updateIndicator} aria-hidden='true' />
              {`Chronous ${appVersion}`}
            </>
          }
          description={`Version ${data.version} is available.`}
        />
      </Panel.ListItem>
    );
  }

  return (
    <Panel.ListItem>
      <Panel.Field title={`Chronous ${appVersion}`} description='You are using the latest version.' />
    </Panel.ListItem>
  );
}
