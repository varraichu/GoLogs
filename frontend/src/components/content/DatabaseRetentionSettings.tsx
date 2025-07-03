import { h } from 'preact';
import { useState } from 'preact/hooks';

const RETENTION_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' }
];

const DatabaseRetentionSettings = () => {
  const [retention, setRetention] = useState<string>('30');

  const handleSave = () => {
    console.log('Saving retention:', retention);
    // TODO: persist retention value to backend
  };

  return (
    <div class="oj-sm-padding-4x oj-flex oj-flex-column" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div class="oj-sm-margin-bottom-4x">
        <label htmlFor="logRetentionPeriod" style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
          Log Retention Period
        </label>
        <select
          id="logRetentionPeriod"
          value={retention}
          onChange={(e) => setRetention((e.target as HTMLSelectElement).value)}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        >
          {RETENTION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <small style={{ display: 'block', marginTop: '6px', color: '#555' }}>
          How long to keep logs in the database
        </small>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'left' }}>
        <oj-button
          chroming="callToAction"
          onojAction={handleSave}
          style={{
            padding: '6px 16px',
            fontSize: '14px',
            borderRadius: '6px',
            fontWeight: 'bold'
          }}
        >
          Save Configuration
        </oj-button>
      </div>
    </div>
  );
};

export default DatabaseRetentionSettings;
