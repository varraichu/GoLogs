import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import DatabaseRetentionSettings from './components/DatabaseRetentionSettings'

const Settings = (props: { path?: string; isAdmin?: boolean; userId?: string }) => {
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
    </div>
  )
}

export default Settings
