// File: src/pages/Applications.tsx
import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import 'oj-c/input-text'
import 'oj-c/button'

import { CardView } from '../Applications/CardView'
import { Application } from '../Applications/CardItem'

const Applications = (props: { path?: string }) => {
  //   const [applications, setApplications] = useState<Application[]>([])
  useEffect(() => {
    fetchGroups().catch((error) => {
      console.error('Failed to fetch applications:', error)
    })
  }, [])
  const [apps, setApps] = useState<Application[]>([])
  const fetchGroups = async () => {
    const token = localStorage.getItem('jwt')

    const res = await fetch('http://localhost:3001/api/apps/', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await res.json()
    setApps(data)
    console.log('Fetched applications:', data)
  }
  return (
    <div class="oj-bg-neutral-20" style="min-height: 100vh; padding: 0 0 40px 0;">
      <div
        class="oj-flex oj-sm-flex-direction-column oj-sm-align-items-center oj-sm-padding-6x"
        style="background: #fff; border-radius: 0 0 24px 24px; box-shadow: 0 2px 16px #e0e0e0;"
      >
        <h2 class="oj-typography-heading-2xl oj-text-color-primary" style="margin-bottom: 8px;">
          Applications
        </h2>
        <div class="oj-typography-body-md oj-text-color-secondary" style="margin-bottom: 24px;">
          Manage and monitor your applications
        </div>
        <div class="oj-flex oj-sm-align-items-center oj-sm-gap-2x" style="margin-bottom: 24px;">
          <oj-c-input-text
            placeholder="Search applications..."
            class="oj-sm-margin-end"
            style="width: 260px;"
          ></oj-c-input-text>
          <oj-c-button chroming="callToAction" label="Create New Application">
            <span slot="startIcon" class="oj-ux-ico-add">+</span>
          </oj-c-button>
        </div>
      </div>
      <div class="oj-flex oj-sm-flex-wrap oj-sm-justify-content-center oj-sm-padding-4x">
        <CardView application={apps} />
      </div>
    </div>
  )
}
export default Applications
