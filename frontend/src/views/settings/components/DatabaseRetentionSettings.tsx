import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import 'ojs/ojbutton'
import 'ojs/ojselectsingle'
import 'oj-c/message-toast'
import { useToast } from '../../../context/ToastContext'
import { getStatusBanner, StatusBannerProps } from './StatusBanner'
import * as statusConfig from './statusConfig.json'
import MutableArrayDataProvider = require('ojs/ojmutablearraydataprovider')
import * as settingsService from './settings.service'
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
  isAdmin: boolean
  userId: string
}

import { ConfirmDialog } from '../../../components/ConfirmDialog'

const DatabaseRetentionSettings = ({ isAdmin, userId }: DatabaseRetentionSettingsProps) => {
  const [retentionPeriod, setRetentionPeriod] = useState({ value: 14, label: '1 days' })
  const [settings, setSettings] = useState({
    error_rate_threshold: -1,
    warning_rate_threshold: -1,
    silent_duration: -1,
  })

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const { addNewToast, messageDataProvider, removeToast } = useToast()

  // Fetch retention and settings on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      // Fetch retention
      try {
        const { ok, data } = await settingsService.fetchRetention()
        if (ok) {
          // setRetention(data.ttlInDays || 30)
          const found = RETENTION_OPTIONS.find((opt) => opt.value === data.ttlInDays)
          setRetentionPeriod(found || { value: 30, label: '30 days' })
        } else {
          addNewToast(
            'error',
            'Failed to fetch retention',
            data.message || 'Error fetching retention'
          )
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        addNewToast('error', 'Failed to fetch retention', msg)
      }
      // Fetch settings
      if (userId) {
        try {
          const { ok, data } = await settingsService.fetchSettings(userId)
          if (ok) {
            setSettings({
              error_rate_threshold: data.error_rate_threshold,
              warning_rate_threshold: data.warning_rate_threshold,
              silent_duration: data.silent_duration,
            })
          } else {
            addNewToast(
              'error',
              'Failed to fetch settings',
              data.message || 'Error fetching settings'
            )
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          addNewToast('error', 'Failed to fetch settings', msg)
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const closeMessage = (event: CustomEvent<{ key: string }>) => {
    removeToast(event.detail.key)
  }

  const onChange = (event: any) => {
    setRetentionPeriod({
      label: RETENTION_OPTIONS.find((opt) => opt.value === event.detail.value)?.label as string,
      value: event.detail.value,
    })
  }

  const dp = new MutableArrayDataProvider<retention['value'], retention>(RETENTION_OPTIONS, {
    keyAttributes: 'value',
  })

  // Handle statusConfig changes
  const handleStatusChange = (config: any, event: any) => {
    const newValue = event.detail.value
    setSettings((prevSettings) => ({
      ...prevSettings,
      [config.value]: newValue,
    }))
  }

  // Save handler (open confirm dialog)
  const handleSaveClick = () => {
    setConfirmDialogOpen(true)
  }

  // Actually send PATCH requests
  const handleConfirmSave = async () => {
    setConfirmDialogOpen(false)
    // PATCH retention
    if (isAdmin) {
      try {
        const { ok, data } = await settingsService.patchRetention(
          retentionPeriod.value
        )
        if (!ok) {
          addNewToast(
            'error',
            'Failed to update retention',
            data.message || 'Error updating retention'
          )
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        addNewToast('error', 'Failed to update retention', msg)
      }
    }
    // PATCH settings
    if (userId) {
      try {
        const { ok, data } = await settingsService.patchSettings(userId, settings)
        if (!ok) {
          addNewToast(
            'error',
            'Failed to update settings',
            data.message || 'Error updating settings'
          )
        } else {
          addNewToast(
            'confirmation',
            'Settings updated',
            data.message || 'Settings updated successfully'
          )
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        addNewToast('error', 'Failed to update settings', msg)
      }
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div class="oj-web-applayout-max-width oj-web-applayout-content oj-panel">
      <h2 class="oj-flex">
        <span class="oj-ux-ico-database oj-text-color-danger oj-typography-heading-md"></span>
        <span class="oj-typography-heading-md">Database Configuration</span>
      </h2>
      <p class="oj-typography-body-md oj-text-color-secondary">
        Configure database retention and system thresholds
      </p>

      <div class="oj-web-applayout-max-width oj-web-applayout-content oj-panel-border-0">
        <h3 class="oj-flex">
          <span class="oj-ux-ico-database oj-text-color-secondary oj-typography-heading-sm"></span>
          <span class="oj-typography-heading-sm oj-text-color-secondary">
            Database Retention
          </span>
        </h3>
        <div class="oj-web-applayout-max-width oj-web-applayout-content oj-panel oj-bg-neutral-20 oj-flex">
          <div class="oj-flex-item oj-sm-align-items-flex-end">
            <h4 class="oj-typography-body-md">Log Retention Period</h4>
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
              readonly={!isAdmin}
              onvalueChanged={onChange}
            ></oj-select-single>
            <div class="oj-flex-item oj-sm-4"></div>
          </div>
        </div>
      </div>
      {(
        <div class="oj-web-applayout-max-width oj-web-applayout-content oj-panel-border-0 oj-flex">
          <h3 class="oj-flex-item oj-flex ">
            <span class="oj-ux-ico-warning oj-text-color-secondary oj-typography-heading-sm"></span>
            <span class="oj-typography-heading-sm oj-text-color-secondary">Alert Thresholds</span>
          </h3>
          {statusConfig.map((config) =>
            getStatusBanner({
              ...config as StatusBannerProps,
              selectValue: settings[config.value as keyof typeof settings],
              onSelectChange: (event) => handleStatusChange(config, event),
            })
          )}
        </div>
      )}
      {
        <div class="oj-panel-border-0 oj-panel-padding  oj-flex">
          <oj-c-button
            class="oj-flex-item oj-sm-flex-initial"
            label="Save Configuration"
            chroming="danger"
            onojAction={handleSaveClick}
          ></oj-c-button>
        </div>
      }
      {confirmDialogOpen && (
        <ConfirmDialog
          title="Confirm configuration"
          message="Are you sure you want to save these settings?"
          confirmText="Save"
          cancelText="Cancel"
          onConfirm={handleConfirmSave}
          onCancel={() => setConfirmDialogOpen(false)}
          confirmType="danger"
          cancelType="borderless"
        />
      )}
      <oj-c-message-toast
        data={messageDataProvider}
        onojClose={closeMessage}
        position="top-right"
        offset={{ horizontal: 10, vertical: 50 }}
      />
    </div>
  )
}

export default DatabaseRetentionSettings
