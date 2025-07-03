import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import 'ojs/ojbutton';
import 'ojs/ojselectsingle';

const RETENTION_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' }
];

const DatabaseRetentionSettings = () => {
  const [retention, setRetention] = useState<number>(30);

  useEffect(()=>{
    async function fetchRetention(){
      const token = localStorage.getItem('jwt');
      try {
        const response = await fetch('http://localhost:3001/api/logs/get/ttl', {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch retention. Status: ${response.status}`);
        }

        const data = await response.json();
        setRetention(data.ttlInDays || 30);
      } catch (error) {
        console.error('Error fetching retention:', error);
      }
    }
    fetchRetention();
  }, [])

  const handleSave = async () => {
    console.log('Saving retention:', retention);
    const token = localStorage.getItem('jwt');
    const body = JSON.stringify({ newTTLInDays: retention });

    try {
      const response = await fetch('http://localhost:3001/api/logs/config/ttl', {
        method: "PATCH",
        headers: {
          'Authorization': `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`Failed to update retention. Status: ${response.status}`);
      }

      console.log('Retention updated successfully');
    } catch (error) {
      console.error('Error saving retention:', error);
    }
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
          onChange={(e) => setRetention(Number((e.target as HTMLSelectElement).value))}
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
        >
          Save Configuration
        </oj-button>
      </div>
    </div>
  );
};

export default DatabaseRetentionSettings;
