import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import 'ojs/ojbutton'
import 'ojs/ojselectsingle'
import 'oj-c/message-toast'
import { useToast } from '../../../context/ToastContext'
import { Backoffs } from 'bullmq'
import { getStatusBanner } from './StatusBanner'
import * as statusConfig from './statusConfig.json'
import MutableArrayDataProvider = require('ojs/ojmutablearraydataprovider')
type retention = {
  value: number
  label: string
}
const RETENTION_OPTIONS: retention[] = [
  { value: 1, label: '24 hours' },
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
]

type DatabaseRetentionSettingsProps = {
  isAdmin : boolean
}
const DatabaseRetentionSettings = ({isAdmin}:DatabaseRetentionSettingsProps) => {
  console.log(isAdmin)
  const [retention, setRetention] = useState<number>(30)

  const [confirmDeleteDialogId, setConfirmDeleteDialogId] = useState<Boolean | null>(null)
  const { addNewToast, messageDataProvider, removeToast } = useToast()
  const [retentionPeriod, setRetentionPeriod] = useState({ value: 14, label: '14 days' })
  // const [settings, setSettings] = useState([
  //    -1,
  //    -2,
  //    -3,
  // ])

  const [settings, setSettings] = useState({
    error_rate_threshold: -1,
    warning_rate_threshold: -1,
    silent_duration: -1,
  })
  const closeMessage = (event: CustomEvent<{ key: string }>) => {
    removeToast(event.detail.key)
    // const closeKey = event.detail.key
    // setMessages(messages.filter((msg) => msg.id !== closeKey))
  }
  const confirmDeleteRetention = () => {
    setConfirmDeleteDialogId(true)
  }

  const onChange = (event: any) => {
    // setFormData({
    //   [event.currentTarget.id]: event.detail.value,
    // });
    setRetentionPeriod({
      label: RETENTION_OPTIONS.find((opt) => opt.value === event.detail.value)?.label as string,
      value: event.detail.value,
    })
    // conole.log(event.detail)
  }
  const dp = new MutableArrayDataProvider<retention['value'], retention>(RETENTION_OPTIONS, {
    keyAttributes: 'value',
  })

  return (
    <div class="oj-web-applayout-max-width oj-web-applayout-content oj-panel">
      <h2 class="oj-flex">
        <span class="oj-ux-ico-database oj-text-color-danger oj-typography-heading-md"></span>
        <span class="oj-typography-heading-md">Database Configuration</span>
      </h2>
      <p class="oj-typography-body-md oj-text-color-secondary">
        Configure database retention and system thresholds
      </p>

      <div class="oj-web-applayout-max-width oj-web-applayout-content oj-panel">
        <h3 class="oj-flex">
          <span class="oj-ux-ico-database oj-text-color-secondary oj-typography-heading-sm"></span>
          <span class="oj-typography-heading-sm oj-text-color-secondary">
            Database Configuration
          </span>
        </h3>
        <div class="oj-web-applayout-max-width oj-web-applayout-content oj-panel oj-bg-neutral-20 oj-flex">
          {/* <h4 > */}
          <div class="oj-flex-item oj-sm-align-items-flex-end">
            <h4 class="oj-typography-body-md">Log Retention Period</h4>
            {/* </h4> */}
            <p class="oj-typography-body-sm oj-text-color-secondary">
              Configure database retention and system thresholds
            </p>
          </div>
          <div class="oj-flex-item oj-sm-align-self-center oj-lg-3">
            <oj-select-single
              class="oj-flex-item oj-sm-8"
              id="retentionPeriod"
              labelHint="Retention Period"
              data={dp}
              value={retentionPeriod.value}
              readonly = {!isAdmin}
              onvalueChanged={onChange}
            ></oj-select-single>
            <div class="oj-flex-item oj-sm-4"></div>
          </div>
        </div>
      </div>
      <div class="oj-web-applayout-max-width oj-web-applayout-content oj-panel oj-flex">
        <h3 class="oj-flex-item oj-flex ">
          <span class="oj-ux-ico-warning oj-text-color-secondary oj-typography-heading-sm"></span>
          <span class="oj-typography-heading-sm oj-text-color-secondary">Alert Thresholds</span>
        </h3>
        {statusConfig.map((config, index) =>
          getStatusBanner({
            ...config,
            // selectData: dp,
            selectValue: settings[config.value as keyof typeof settings],
            onSelectChange: (event) => {
              const newValue = event.detail.value

              setSettings((prevSettings) => ({
                ...prevSettings,
                [config.value]: newValue,
              }))
              console.log(settings)
            },
          })
        )}
      </div>
      <div class="oj-panel  oj-flex">
        <oj-c-button
          class="oj-flex-item oj-sm-2"
          label="Save Configuration"
          chroming="danger"
          // style="--oj-c-button-bg-color: red; --oj-c-button-text-color: white;"
        ></oj-c-button>
      </div>
    </div>
  )
}

export default DatabaseRetentionSettings
{
  /* <div
  class="oj-sm-padding-4x oj-flex oj-flex-column oj-typography-heading-lg "
  // style={{ maxWidth: '600px', margin: '0 auto', background: 'white' }}
>
  <div class="oj-sm-margin-bottom-4x">
    <label
      htmlFor="logRetentionPeriod"
      // style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}
    >
      Log Retention Period
    </label>

    <select
      id="logRetentionPeriod"
      value={retention}
      onChange={(e) => setRetention(Number((e.target as HTMLSelectElement).value))}
      // style={{
      //   width: '100%',
      //   padding: '10px',
      //   fontSize: '16px',
      //   borderRadius: '4px',
      //   border: '1px solid #ccc',
      // }}
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
    <oj-button chroming="callToAction" onojAction={() => confirmDeleteRetention()}>
      Set Configuration
    </oj-button>
  </div>
  {confirmDeleteDialogId && (
    <oj-dialog
      id="confirmDeleteDialog"
      dialogTitle="Confirm configuration"
      initialVisibility="show"
    >
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
</div> */
}
{
  /* </div> */
}

// useEffect(() => {
//     async function fetchRetention() {
//       const token = localStorage.getItem('jwt')
//       try {
//         const response = await fetch('http://localhost:3001/api/logs/get/ttl', {
//           method: 'GET',
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         })

//         const data = await response.json()
//         if (!response.ok) {
//           addNewToast(
//             'error',
//             'Failed to fetch retention value',
//             data.message || 'An error occurred while fetching the retention value.'
//           )
//         }
//         // else {
//         //   addNewToast(
//         //     'confirmation',
//         //     'Retention value fetched',
//         //     data.message || 'Retention value fetched successfully.'
//         //   )
//         // }
//         setRetention(data.ttlInDays || 30)
//       } catch (error) {
//         console.error('Error fetching retention:', error)
//       }
//     }
//     fetchRetention()
//   }, [])

//   const handleSave = async () => {
//     console.log('Saving retention:', retention)
//     const token = localStorage.getItem('jwt')
//     const body = JSON.stringify({ newTTLInDays: retention })

//     try {
//       if (!confirmDeleteDialogId) return
//       const response = await fetch('http://localhost:3001/api/logs/config/ttl', {
//         method: 'PATCH',
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body,
//       })

//       const data = await response.json()
//       if (!response.ok) {
//         addNewToast(
//           'error',
//           'Failed to update retention value',
//           data.message || 'An error occurred while updating the retention value.'
//         )
//       } else {
//         addNewToast(
//           'confirmation',
//           'Retention value updated',
//           data.message || 'Retention value updated successfully.'
//         )
//       }
//       setConfirmDeleteDialogId(null)
//     } catch (error) {
//       console.error('Error saving retention:', error)
//     }
//   }


// 1. GET /api/settings/:user_id
// Purpose:
// Retrieve the settings for a specific user by their user ID.
// If no settings exist, create default settings and return them.
// Access:
// Authenticated users can access their own settings or admins can access any user's settings.
// Request Params:
// user_id (string): MongoDB ObjectId of the user.
// Response:
// Status: 200 OK
// Body (JSON):

// {
//   "_id": "ObjectId",
//   "user_id": "ObjectId",
//     "error_rate_threshold": number,     // logs per minute (critical threshold)
//   "warning_rate_threshold": number,   // logs per minute (warning threshold)
//   "silent_duration": number,          // hours of inactivity before alerting
// }

// Status: 404 Not Found
// When user does not exist.
// Status: 500 Internal Server Error
// On server errors.

// 2. PATCH /api/settings/:user_id
// Purpose:
// Update one or more fields of a user’s settings.
// Access:
// Authenticated users can update their own settings or admins can update any user's settings.
// Request Params:
// user_id (string): MongoDB ObjectId of the user.
// Request Body:
// JSON object with any subset of:

// {
//   "error_rate_threshold": number,   // optional
//   "warning_rate_threshold": number, // optional
//   "silent_duration": number          // optional
// }

// Response:
// Status: 200 OK
// Body (JSON):

// {
//   "_id": "ObjectId",
//   "user_id": "ObjectId",
//   "error_rate_threshold": number,     // logs per minute (critical threshold)
//   "warning_rate_threshold": number,   // logs per minute (warning threshold)
//   "silent_duration": number,          // hours of inactivity before alerting


// }

// Status: 404 Not Found
// When user or settings not found.
// Status: 500 Internal Server Error
// On server errors.

// Notes:
// All ObjectIds are strings representing MongoDB object IDs.
// Default values (if settings created implicitly):
// error_rate_threshold: 10
// warning_rate_threshold: 25
// silent_duration: 12