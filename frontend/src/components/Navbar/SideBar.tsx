import 'ojs/ojnavigationlist'
import 'ojs/ojavatar'
import 'ojs/ojlistitemlayout'
import { h } from 'preact'
import { route } from 'preact-router'
import { Slot } from 'ojs/ojvcomponent'
import { useState } from 'preact/hooks'
import './SideBar.css' // <-- Add this line to import custom styles

// Inside your component:

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
  const [activeItem, setActiveItem] = useState<string>('dashboard')

  const handleNavigation = (path: string, id: string) => {
    setActiveItem(id)
    route(path)
  }

  const handleSignOut = (e: Event) => {
    e.preventDefault()
    localStorage.removeItem('jwt')
    setIsAuthenticated && setIsAuthenticated(false)
    window.history.replaceState({}, '', window.location.origin + '/')
  }

  return (
    <div
      slot={slot as string}
      class="oj-flex oj-sm-flex-direction-column oj-sm-justify-content-space-between sidebar-container"
      style="height: 100vh; width: 240px; background-color: #fff; box-shadow: 2px 0 6px rgba(0,0,0,0.05); box-sizing: border-box;"
    >
      <div>
        {/* Logo */}
        <div class="oj-sm-margin-bottom-4x sidebar-logo">
          <h1 class="oj-typography-heading-md oj-text-color-primary">
            <span style="color: red;">Go</span>Logs
          </h1>
        </div>
        <li class="oj-navigationlist-category-divider"></li>

        {/* User Info */}
        <div class="oj-flex oj-align-items-center sidebar-profile">
          <oj-avatar
            size="sm"
            class="oj-sm-margin-end-2x"
            src={pictureUrl || undefined}
            initials={!pictureUrl && username ? username[0] : undefined}
          ></oj-avatar>
          <div class={'oj-flex oj-sm-flex-direction-column oj-sm-gap-2x'}>
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

        {/* Nav Items */}
        <li class="oj-navigationlist-category-divider"></li>
        <oj-navigation-list
          drill-mode="none"
          display="all"
          class="oj-navigationlist-stack-icon-label oj-focus-highlight"
          style="--oj-navigation-list-item-padding: 8px 12px; --oj-navigation-list-item-border-radius: 8px; --oj-navigation-list-item-hover-background-color: #fef2f2; --oj-navigation-list-item-active-background-color: #fee2e2; --oj-navigation-list-item-active-border-left-color: #dc2626; --oj-navigation-list-item-active-padding-left: 12px;"
        >
          <ul>
            <oj-list-item-layout
              id="dashboard"
              class={activeItem === 'dashboard' ? 'sidebar-active' : ''}
              onClick={() => handleNavigation('/dashboard', 'dashboard')}
            >
              <span slot="leading" class="oj-ux-ico-layout-mosaic"></span>
              <span>Dashboard</span>
            </oj-list-item-layout>
            {isAdmin && (
              <oj-list-item-layout
                id="usergroups"
                class={activeItem === 'usergroups' ? 'sidebar-active' : ''}
                onClick={() => handleNavigation('/usergroups', 'usergroups')}
              >
                <span slot="leading" class="oj-ux-ico-people"></span>
                <span>User Groups</span>
              </oj-list-item-layout>
            )}
            <oj-list-item-layout
              id="apps"
              class={activeItem === 'apps' ? 'sidebar-active' : ''}
              onClick={() => handleNavigation('/applications', 'apps')}
            >
              <span slot="leading" class="oj-ux-ico-apps-grid"></span>
              <span>Applications</span>
            </oj-list-item-layout>
            <oj-list-item-layout
              id="logs"
              class={activeItem === 'logs' ? 'sidebar-active' : ''}
              onClick={() => handleNavigation('/logs', 'logs')}
            >
              <span slot="leading" class="oj-ux-ico-log"></span>
              <span>Logs</span>
            </oj-list-item-layout>
            <oj-list-item-layout
              id="settings"
              class={activeItem === 'settings' ? 'sidebar-active' : ''}
              onClick={() => handleNavigation('/settings', 'settings')}
            >
              <span slot="leading" class="oj-ux-ico-settings"></span>
              <span>Settings</span>
            </oj-list-item-layout>
          </ul>
        </oj-navigation-list>
      </div>

      {/* Sign Out */}
      <div class="sidebar-signout">
        <li class="oj-navigationlist-category-divider"></li>
        <a
          href="#"
          onClick={handleSignOut}
          class="oj-typography-body-sm oj-text-color-danger"
          style="display: flex; align-items: center; gap: 8px;"
        >
          <span class="oj-ux-ico-signout"></span> Sign Out
        </a>
      </div>
    </div>
  )
}
