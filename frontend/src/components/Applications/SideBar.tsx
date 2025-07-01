import 'ojs/ojnavigationlist'
import 'ojs/ojavatar'
import 'ojs/ojlistitemlayout'
import { h } from 'preact'
import { Slot } from 'ojs/ojvcomponent'

type Props = {
  slot?: Slot
}

export function SideBar({ slot = 'start' }: Props) {
  return (
    <div
      slot={slot as string}
      class="oj-flex oj-sm-flex-direction-column oj-sm-justify-content-space-between"
      style="height: 90vh; width: 180px; padding: 16px; box-sizing: border-box;"
    >
      <div>
        {/* Top Section: Logo */}
        <div
          style="flex: 1 1 auto;"
          class="oj-flex oj-sm-flex-direction-column oj-sm-justify-content-flex-start"
        >
          <div class="oj-flex oj-sm-align-items-center oj-sm-margin-bottom-1x">
            <div style="font-size: 24px; font-weight: bold; margin-right: 8px;">GL</div>
            <span class="oj-typography-heading-sm">GoLogs</span>
          </div>
        </div>
        {/* Middle Section 1: User Profile */}
        <div>
          <div class="oj-flex oj-align-items-center oj-sm-margin-bottom-6x">
            <oj-avatar initials="C" size="sm" class="oj-sm-margin-end-2x"></oj-avatar>
            <div>
              <div class="oj-typography-body-md oj-text-color-primary">Client User</div>
              <div class="oj-typography-subbody-sm oj-text-color-secondary">Client</div>
            </div>
          </div>
          {/* Middle Section 2: Navigation */}
          <oj-navigation-list
            drill-mode="none"
            display="all"
            // selection="dashboard"
            class="oj-navigationlist-stack-icon-label oj-sm-padding-end-2x"
          >
            <ul>
              <oj-list-item-layout id="dashboard">
                <span slot="leading" class="oj-ux-ico-layout-mosaic"></span>
                <span>Dashboard</span>
              </oj-list-item-layout>
              <oj-list-item-layout id="apps">
                <span slot="leading" class="oj-ux-ico-apps-grid"></span>
                <span>Apps</span>
              </oj-list-item-layout>
              <oj-list-item-layout id="logs">
                <span slot="leading" class="oj-ux-ico-log"></span>
                <span>Logs</span>
              </oj-list-item-layout>

              <oj-list-item-layout id="settings">
                <span slot="leading" class="oj-ux-ico-settings"></span>
                <span>Settings</span>
              </oj-list-item-layout>
            </ul>
          </oj-navigation-list>
        </div>
      </div>

      {/* Bottom Section: Sign Out */}
      <div>
        <a href="#" class="oj-typography-body-sm oj-text-color-danger">
          Sign Out
        </a>
      </div>
    </div>
  )
}
