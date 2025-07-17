// SideBar.tsx
import 'ojs/ojnavigationlist'
import 'ojs/ojavatar'
import 'ojs/ojlistitemlayout'
import { h } from 'preact'
import { route } from 'preact-router'
import { useEffect, useState } from 'preact/hooks'
import './SideBar.css'

type Props = {
  setIsAuthenticated?: (value: boolean) => void
  isAdmin?: boolean
  username?: string
  pictureUrl?: string
  activeItem: string
  setActiveItem: (id: string) => void
  collapsed: boolean
}

const mapping: Record<string, string> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/usergroups': 'usergroups',
  '/applications': 'applications',
  '/user-applications': 'applications',
  '/logs': 'logs',
  '/settings': 'settings',
}

export function SideBar({
  setIsAuthenticated,
  isAdmin,
  pictureUrl,
  username,
  activeItem,
  collapsed,
  setActiveItem,
}: Props) {

  useEffect(() => {
    const p = window.location.pathname
    if (p === '/') route('/dashboard')
    setActiveItem(mapping[p] || 'dashboard')
    console.log('SideBar received pictureUrl:', pictureUrl)
    console.log('pictureUrl exists:', !!pictureUrl)
    console.log('username exists:', !!username)
  }, [])

  const navigate = (path: string, id: string) => {
    setActiveItem(id)
    route(path === '/' ? '/dashboard' : path)
  }

  // Helper function to render avatar
  const renderAvatar = (size: 'xs' | 'sm') => {
    const className = size === 'xs' 
      ? "oj-md-padding-4x-vertical oj-md-padding-3x-horizontal oj-align-items-center oj-flex-item sidebar-avatar-collapsed"
      : "oj-sm-margin-end-5x oj-sm-padding-2x"
    
    // console.log('Rendering avatar with:', { pictureUrl, username, size })
    
    if (pictureUrl) {
      return (
        <oj-avatar
          size={size}
          src={pictureUrl}
          class={className}
          slot={size === 'sm' ? 'leading' : undefined}
        />
      )
    } else if (username) {
      return (
        <oj-avatar
          size={size}
          initials={username[0]}
          class={className}
          slot={size === 'sm' ? 'leading' : undefined}
        />
      )
    } else {
      return (
        <oj-avatar
          size={size}
          class={className}
          slot={size === 'sm' ? 'leading' : undefined}
        />
      )
    }
  }

  return (
    <div
      class={`oj-flex oj-sm-flex-direction-column sidebar-container ${collapsed ? 'collapsed' : ''}`}
      slot="start"
    >
      {/* Profile */}
      {collapsed ? (
        renderAvatar('xs')
      ) : (
        <div class="oj-flex oj-align-items-center oj-md-padding-2x">
          {renderAvatar('sm')}
          <div style="display: flex; flex-direction: column;" class="oj-sm-gap-1x oj-sm-padding-2x">
            <div class="oj-typography-body-md oj-text-color-primary">{username?.split(' ')[0]}</div>
            <div class="oj-typography-body-md oj-text-color-primary">{username?.split(' ')[1]}</div>
            <div class="oj-typography-subbody-sm oj-text-color-secondary">
              {isAdmin ? 'Admin' : 'User'}
            </div>
          </div>
        </div>
      )}

      <li class="oj-navigationlist-category-divider"></li>

      {/* Navigation */}
      {collapsed ? (
        <oj-navigation-list
          aria-label="Collapsed Nav"
          selection-mode="single"
          display="icons"
          selection={activeItem}
          class="oj-navigationlist-vertical oj-focus-highlight selected-red"
        >
          <ul>
            <li
              id="dashboard"
              onClick={() => navigate('/dashboard', 'dashboard')}
            >
              <span class="oj-ux-ico-layout-mosaic" />
            </li>
            {isAdmin && (
              <li
                id="usergroups"
                onClick={() => navigate('/usergroups', 'usergroups')}
              >
                <span class="oj-ux-ico-group-avatar" />
              </li>
            )}
            <li
              id="applications"
              onClick={() =>
                navigate(isAdmin ? '/applications' : '/user-applications', 'applications')
              }
            >
              <span class="oj-ux-ico-apps-grid" />
            </li>
            <li
              id="logs"
              onClick={() => navigate('/logs', 'logs')}
            >
              <span class="oj-ux-ico-log" />
            </li>
            <li
              id="settings"
              onClick={() => navigate('/settings', 'settings')}
            >
              <span class="oj-ux-ico-settings" />
            </li>
          </ul>
        </oj-navigation-list>
      ) : (
        <oj-navigation-list
          aria-label="Expanded Nav"
          selection-mode="single"
          selection={activeItem}
          class="oj-navigationlist-vertical oj-focus-highlight selected-red"
        >
          <ul>
            <oj-list-item-layout
              id="dashboard"
              onClick={() => navigate('/dashboard', 'dashboard')}
            >
              <span slot="leading" class="oj-ux-ico-layout-mosaic" />
              <span>Dashboard</span>
            </oj-list-item-layout>
            {isAdmin && (
              <oj-list-item-layout
                id="usergroups"
                onClick={() => navigate('/usergroups', 'usergroups')}
              >
                <span slot="leading" class="oj-ux-ico-group-avatar" />
                <span>User Groups</span>
              </oj-list-item-layout>
            )}
            <oj-list-item-layout
              id="applications"
              onClick={() =>
                navigate(isAdmin ? '/applications' : '/user-applications', 'applications')
              }
            >
              <span slot="leading" class="oj-ux-ico-apps-grid" />
              <span>Applications</span>
            </oj-list-item-layout>
            <oj-list-item-layout
              id="logs"
              onClick={() => navigate('/logs', 'logs')}
            >
              <span slot="leading" class="oj-ux-ico-log" />
              <span>Logs</span>
            </oj-list-item-layout>
            <oj-list-item-layout
              id="settings"
              onClick={() => navigate('/settings', 'settings')}
            >
              <span slot="leading" class="oj-ux-ico-settings" />
              <span>Settings</span>
            </oj-list-item-layout>
          </ul>
        </oj-navigation-list>
      )}
    </div>
  )
}