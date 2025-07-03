import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import DatabaseRetentionSettings from '../content/DatabaseRetentionSettings';

const Settings = (props: { path?: string }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [retention, setRetention] = useState<number>(0); // default

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setIsAdmin(payload.isAdmin);

      if (!payload.isAdmin) {
        // Fetch retention for non-admin users
        async function fetchRetention() {
          try {
            const response = await fetch('http://localhost:3001/api/logs/get/ttl', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
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
      }
    } catch (err) {
      console.error('Invalid JWT token:', err);
    }
  }, []);

  if (isAdmin === null) return null; // wait until admin check completes

  return (
    <div class="oj-sm-padding-4x">
      <h1 class="oj-typography-heading-lg">System Configuration</h1>
      <p class="oj-typography-body-md">Configure database retention and system thresholds</p>

      {isAdmin ? (
        <DatabaseRetentionSettings />
      ) : (
        <oj-c-input-text
          id="retention-readonly"
          labelHint="Database Retention (Days)"
          value={retention.toString()}
          readonly
          style={{
            width: '20%',
            padding: '10px',
            fontSize: '16px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        ></oj-c-input-text>
      )}
    </div>
  );
};

export default Settings;
