import { h } from 'preact';
import DatabaseRetentionSettings from '../content/DatabaseRetentionSettings';

const AdminSettings = (props: { path?: string }) => {
  return (
    <div class="oj-sm-padding-4x">
      <h1 class="oj-typography-heading-lg">System Configuration</h1>
      <p class="oj-typography-body-md">Configure database retention and system thresholds</p>

      <DatabaseRetentionSettings />  
      {/* other configurations go here */}

    </div>
  );
};

export default AdminSettings;
