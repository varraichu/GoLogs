// components/CardItem.tsx
import { h } from 'preact'
import { ApplicationDialog } from './ApplicationDialog'
import { useState } from 'preact/hooks'
import { ObjectId } from 'mongodb'
import 'oj-c/button'

export type Application = {
  _id: ObjectId
  name: string
  description: string
  // status: "Healthy" | "Warning" | "Critical";
  logCount: number
  // clients: number;
  // assignedTo: string[];
  // createdDate: string
  created_at: string
  // icon: string;
}

type Props = {
  data: Application
}

// The template renderer function — same signature JET expects
export function renderCardItem(itemContext: { data: Application }) {
  const { data } = itemContext
  const [isClicked, setIsClicked] = useState(false)
  const [userGroups, setUserGroups] = useState<string[]>([])

  return (
    <div
      class="oj-panel oj-panel-shadow-md oj-bg-neutral-10 oj-sm-margin-4x"
      style="border-radius: 18px; padding: 32px 28px; min-width: 300px; max-width: 370px; display: flex; flex-direction: column; justify-content: space-between;"
    >
      <div>
        <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-space-between">
          <div class="oj-flex oj-sm-align-items-center">
            <span class="oj-ux-ico-app oj-ux-ico-xl oj-text-color-primary"></span>
            <span class="oj-typography-heading-md oj-sm-margin-start">{data.name}</span>
          </div>
        </div>

        <div style="margin: 18px 0 10px 0;">
          <div class="oj-typography-body-md oj-text-color-secondary">{data.description}</div>
        </div>

        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 18px 0;" />

        <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-space-between" style="margin-bottom: 12px;">
          <div class="oj-flex oj-sm-align-items-center">
            <span class="oj-ux-ico-chart oj-text-color-info"></span>
            <span class="oj-typography-body-sm oj-sm-margin-start">
              <b>{data.logCount}</b> Logs
            </span>
          </div>
          <div class="oj-flex oj-sm-align-items-center">
            <span class="oj-ux-ico-users oj-text-color-success"></span>
            <span class="oj-typography-body-sm oj-sm-margin-start">
              {userGroups.length === 0 ? (
                <b>Unassigned</b>
              ) : (
                userGroups.map((group, idx) => (
                  <b key={idx}>
                    {group}
                    {idx < userGroups.length - 1 ? ', ' : ''}
                  </b>
                ))
              )}
            </span>
          </div>
        </div>

        <div class="oj-typography-caption oj-text-color-tertiary" style="margin-top: 10px;">
          Created: {data.created_at}
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 18px 0 10px 0;" />

      <div class="oj-flex oj-sm-justify-content-flex-end oj-sm-gap-2x">
        <oj-c-button
          display="icons"
          chroming="borderless"
          label="Edit"
          onojAction={() => setIsClicked(true)}
        >
          <span slot="startIcon" class="oj-ux-ico-edit">✎</span>
        </oj-c-button>
        <oj-c-button
          display="icons"
          chroming="danger"
          label="Delete"
          disabled
        >
          <span slot="startIcon" class="oj-ux-ico-delete">🗑</span>
        </oj-c-button>
      </div>
      <ApplicationDialog
        data={data}
        isCLicked={isClicked}
        closePopup={() => setIsClicked(false)}
        setUserGroups2={setUserGroups}
      />
    </div>
  )
}
