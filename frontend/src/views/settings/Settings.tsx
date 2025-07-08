import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import DatabaseRetentionSettings from './components/DatabaseRetentionSettings'

const Settings = (props: { path?: string; isAdmin?: boolean; userId?: string }) => {
  // const [retention, setRetention] = useState<number>(0) // default

  // useEffect(() => {
  //   try {
  //     if (!props.isAdmin) {
  //       // Fetch retention for non-admin users
  //       async function fetchRetention() {
  //         try {
  //           const response = await fetch('http://localhost:3001/api/logs/get/ttl', {
  //             method: 'GET',
  //             headers: {
  //               Authorization: `Bearer ${token}`,
  //               'Content-Type': 'application/json',
  //             },
  //           })

  //           if (!response.ok) {
  //             throw new Error(`Failed to fetch retention. Status: ${response.status}`)
  //           }

  //           const data = await response.json()
  //           setRetention(data.ttlInDays || 30)
  //         } catch (error) {
  //           console.error('Error fetching retention:', error)
  //         }
  //       }

  //       fetchRetention()
  //     }
  //   } catch (err) {
  //     console.error('Invalid JWT token:', err)
  //   }
  // }, [])

  // if (props.isAdmin === null) return null // wait until admin check completes

  return (
    <div class="oj-sm-padding-4x">
      <h1 class="oj-typography-heading-lg">System Configuration</h1>
      <p class="oj-typography-body-md oj-text-color-secondary">
        Configure database retention and system thresholds
      </p>

      <DatabaseRetentionSettings
        isAdmin={props.isAdmin as boolean}
        userId={props.userId as string}
      />
      {/* {isAdmin ? (
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
      )} */}
    </div>
  )
}

export default Settings
