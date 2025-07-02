import 'ojs/ojnavigationlist'
import 'ojs/ojavatar'
import 'ojs/ojlistitemlayout'
import { h } from 'preact'
import { route } from 'preact-router'
import { Slot } from 'ojs/ojvcomponent'

type Props = {
  slot?: Slot
  setIsAuthenticated?: (value: boolean) => void
  isAdmin?: boolean
  username?: string
  pictureUrl?: string
}

export function SideBar({
  slot = 'start',
  setIsAuthenticated,
  isAdmin,
  pictureUrl,
  username,
}: Props) {
  const handleNavigation = (path: string) => {
    route(path)
  }
  console.log('SideBar rendered with isAdmin:', isAdmin)
  console.log('SideBar rendered with email:', username)
  console.log('SideBar rendered with pictureUrl:', pictureUrl)

  const handleSignOut = (e: Event) => {
    e.preventDefault()
    localStorage.removeItem('jwt')
    setIsAuthenticated && setIsAuthenticated(false)
    window.history.replaceState({}, '', window.location.origin + '/')
  }

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
            {/* <div style="font-size: 24px; font-weight: bold; margin-right: 8px;">GL</div> */}
            <h1 class="oj-typography-heading-xl oj-text-color-primary">
              <span style="color: red;">Go</span>Logs
            </h1>
          </div>
        </div>
        {/* Middle Section 1: User Profile */}
        <div>
          <div class="oj-flex oj-align-items-center oj-sm-margin-bottom-6x">
            <oj-avatar
              size="sm"
              class="oj-sm-margin-end-2x"
              src={pictureUrl || undefined}
              initials={!pictureUrl && username ? username[0] : undefined}
            ></oj-avatar>
            <div>
              <div class="oj-typography-body-md oj-text-color-primary">
                {username && username.split(' ')[0]}
              </div>
              <div class="oj-typography-body-md oj-text-color-primary">
                {username && username.split(' ')[1]}
              </div>
              <div class="oj-typography-subbody-sm oj-text-color-secondary">
                {isAdmin ? 'Admin' : 'Client'}
              </div>
            </div>
          </div>
          {/* Middle Section 2: Navigation */}
          <oj-navigation-list
            drill-mode="none"
            display="all"
            class="oj-navigationlist-stack-icon-label oj-sm-padding-end-2x"
          >
            <ul>
              <oj-list-item-layout id="dashboard" onClick={() => handleNavigation('/dashboard')}>
                {/* <div> */}
                <span slot="leading" class="oj-ux-ico-layout-mosaic"></span>
                <span>Dashboard</span>
                {/* </div> */}
              </oj-list-item-layout>
              <oj-list-item-layout id="apps" onClick={() => handleNavigation('/applications')}>
                <span slot="leading" class="oj-ux-ico-apps-grid"></span>
                <span>Apps</span>
              </oj-list-item-layout>
              <oj-list-item-layout id="logs" onClick={() => handleNavigation('/logs')}>
                <span slot="leading" class="oj-ux-ico-log"></span>
                <span>Logs</span>
              </oj-list-item-layout>
              <oj-list-item-layout id="settings" onClick={() => handleNavigation('/settings')}>
                <span slot="leading" class="oj-ux-ico-settings"></span>
                <span>Settings</span>
              </oj-list-item-layout>
              {isAdmin && (
                <oj-list-item-layout
                  id="usergroups"
                  onClick={() => handleNavigation('/usergroups')}
                >
                  <span slot="leading" class="oj-ux-ico-people"></span>
                  <span>User Groups</span>
                </oj-list-item-layout>
              )}
            </ul>
          </oj-navigation-list>
        </div>
      </div>

      {/* Bottom Section: Sign Out */}
      <div>
        <a href="#" class="oj-typography-body-sm oj-text-color-danger" onClick={handleSignOut}>
          Sign Out
        </a>
      </div>
    </div>
  )
}
