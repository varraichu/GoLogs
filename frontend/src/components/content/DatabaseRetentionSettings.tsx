import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import 'ojs/ojbutton';
import 'ojs/ojselectsingle';
import "oj-c/message-toast"
import { useToast } from '../../context/ToastContext';

const RETENTION_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' }
];

const DatabaseRetentionSettings = () => {
  const [retention, setRetention] = useState<number>(30);

  const [confirmDeleteDialogId, setConfirmDeleteDialogId] = useState<Boolean | null>(null)
  const { addNewToast, messageDataProvider, removeToast } = useToast()
  const closeMessage = (event: CustomEvent<{ key: string }>) => {
    removeToast(event.detail.key)
    // const closeKey = event.detail.key
    // setMessages(messages.filter((msg) => msg.id !== closeKey))
  }
  const confirmDeleteRetention = () => {
    setConfirmDeleteDialogId(true);
  }

  useEffect(() => {
    async function fetchRetention() {
      const token = localStorage.getItem('jwt');
      try {
        const response = await fetch('http://localhost:3001/api/logs/get/ttl', {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        });


        const data = await response.json();
        if (!response.ok) {
          addNewToast(
            'error',
            'Failed to fetch retention value',
            data.message || 'An error occurred while fetching the retention value.'
          )
        } 
        // else {
        //   addNewToast(
        //     'confirmation',
        //     'Retention value fetched',
        //     data.message || 'Retention value fetched successfully.'
        //   )
        // }
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
      if (!confirmDeleteDialogId) return
      const response = await fetch('http://localhost:3001/api/logs/config/ttl', {
        method: "PATCH",
        headers: {
          'Authorization': `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body,
      });

      const data = await response.json();
      if (!response.ok) {
        addNewToast(
          'error',
          'Failed to update retention value',
          data.message || 'An error occurred while updating the retention value.'
        )
      } else {
        addNewToast(
          'confirmation',
          'Retention value updated',
          data.message || 'Retention value updated successfully.'
        )
      }
      setConfirmDeleteDialogId(null)
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
          onojAction={() => confirmDeleteRetention()}
        >
          Set Configuration
        </oj-button>
      </div>
      {confirmDeleteDialogId && (
        <oj-dialog id="confirmDeleteDialog" dialogTitle="Confirm configuration" initialVisibility="show">
          <div class="oj-dialog-body">Are you sure you want to set this retention period?</div>
          <div class="oj-dialog-footer">
            <oj-button onojAction={handleSave} chroming="danger">
              Save
            </oj-button>
            <oj-button onojAction={() => setConfirmDeleteDialogId(null)} chroming="borderless">
              Cancel
            </oj-button>
          </div>
        </oj-dialog>
      )}
      <oj-c-message-toast
        data={messageDataProvider}
        onojClose={closeMessage}
        position="top-right"
        offset={{ horizontal: 10, vertical: 50 }}
      />
    </div>
  );
};

export default DatabaseRetentionSettings;
