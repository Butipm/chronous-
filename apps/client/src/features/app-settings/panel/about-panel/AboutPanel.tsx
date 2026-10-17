import * as Panel from '../../panel-utils/PanelUtils';
import AppVersion from './AppVersion';

export default function AboutPanel() {
  return (
    <>
      <Panel.Header>About Chronous</Panel.Header>
      <Panel.Section>
        <Panel.Card>
          <Panel.SubHeader>Current version</Panel.SubHeader>
          <Panel.Divider />
          <Panel.ListGroup>
            <AppVersion />
          </Panel.ListGroup>
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
