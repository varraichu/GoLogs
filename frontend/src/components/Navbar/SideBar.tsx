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
  // slot = 'start',
  setIsAuthenticated,
  isAdmin,
  pictureUrl,
  username,
}: Props) {
  // isAdmin=false
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
    <div slot="start" class="oj-flex oj-sm-flex-direction-column  ">
      {/* <!-- Profile section (avatar + name) --> */}
      <div class="oj-flex oj-align-items-center oj-md-padding-4x">
        <oj-avatar
          size="sm"
          class="oj-sm-margin-end-5x oj-sm-padding-2x "
          src={pictureUrl || undefined}
          initials={!pictureUrl && username ? username[0] : undefined}
          slot="leading"
        ></oj-avatar>
        <div style="display: flex; flex-direction: column;" class="oj-sm-gap-1x oj-sm-padding-2x">
          <div class="oj-typography-body-md oj-text-color-primary">{username?.split(' ')[0]}</div>
          <div class="oj-typography-body-md oj-text-color-primary">{username?.split(' ')[1]}</div>
          <div class="oj-typography-subbody-sm oj-text-color-secondary">
            {isAdmin ? 'Admin' : 'Client'}
          </div>
        </div>
      </div>
      <li class="oj-navigationlist-category-divider"></li>
      {/* <!-- Navigation list --> */}
      <oj-navigation-list aria-label="Main Navigation" selection-mode="single">
        <ul>
          <li id="dashboard">
            <a href="/dashboard">
              <span class="oj-navigationlist-item-icon oj-ux-ico-layout-mosaic"></span>
              Dashboard
            </a>
          </li>
          {isAdmin&&<li id="usergroups">
            <a href="/usergroups">
              <span class="oj-navigationlist-item-icon oj-ux-ico-people"></span>
              User Groups
            </a>
          </li>}
          <li id="applications">
            <a href={isAdmin?"/applications":"/user-applications"}>
              <span class="oj-navigationlist-item-icon oj-ux-ico-apps-grid"></span>
              Applications
            </a>
          </li>
          <li id="logs">
            <a href="/logs">
              <span class="oj-navigationlist-item-icon oj-ux-ico-log"></span>
              Logs
            </a>
          </li>
          <li id="settings">
            <a href="/settings">
              <span class="oj-navigationlist-item-icon oj-ux-ico-settings"></span>
              Settings
            </a>
          </li>
        </ul>
      </oj-navigation-list>
    </div>
  )
}
// {/* <div> */}
//       {/* Logo
//       <div class="oj-sm-margin-bottom-4x sidebar-logo">
//         <h1 class="oj-typography-heading-md oj-text-color-primary">
//           <span style="color: red;">Go</span>Logs
//         </h1>
//       </div>
//       <li class="oj-navigationlist-category-divider"></li> */}

//       {/* User Info */}
//       <div class="oj-flex oj-align-items-center sidebar-profile">
//         <oj-avatar
//           size="sm"
//           class="oj-sm-margin-end-2x"
//           src={pictureUrl || undefined}
//           initials={!pictureUrl && username ? username[0] : undefined}
//         ></oj-avatar>
//         <div class={'oj-flex oj-sm-flex-direction-column oj-sm-gap-2x'}>
//           <div class="oj-typography-body-md oj-text-color-primary">
//             {username && username.split(' ')[0]}
//           </div>
//           <div class="oj-typography-body-md oj-text-color-primary">
//             {username && username.split(' ')[1]}
//           </div>
//           <div class="oj-typography-subbody-sm oj-text-color-secondary">
//             {isAdmin ? 'Admin' : 'Client'}
//           </div>
//         </div>
//       </div>

//       {/* Nav Items */}
//       <li class="oj-navigationlist-category-divider"></li>
//       <oj-navigation-list
//         drill-mode="none"
//         display="all"
//         class="oj-navigationlist-stack-icon-label oj-focus-highlight"
//         style="--oj-navigation-list-item-padding: 8px 12px; --oj-navigation-list-item-border-radius: 8px; --oj-navigation-list-item-hover-background-color: #fef2f2; --oj-navigation-list-item-active-background-color: #fee2e2; --oj-navigation-list-item-active-border-left-color: #dc2626; --oj-navigation-list-item-active-padding-left: 12px;"
//       >
//         <ul>
//           <oj-list-item-layout
//             id="dashboard"
//             class={activeItem === 'dashboard' ? 'sidebar-active' : ''}
//             onClick={() => handleNavigation('/dashboard', 'dashboard')}
//           >
//             <span slot="leading" class="oj-ux-ico-layout-mosaic"></span>
//             <span>Dashboard</span>
//           </oj-list-item-layout>
//           {isAdmin && (
//             <oj-list-item-layout
//               id="usergroups"
//               class={activeItem === 'usergroups' ? 'sidebar-active' : ''}
//               onClick={() => handleNavigation('/usergroups', 'usergroups')}
//             >
//               <span slot="leading" class="oj-ux-ico-people"></span>
//               <span>User Groups</span>
//             </oj-list-item-layout>
//           )}
//           <oj-list-item-layout
//             id="apps"
//             class={activeItem === 'apps' ? 'sidebar-active' : ''}
//             onClick={() => handleNavigation('/applications', 'apps')}
//           >
//             <span slot="leading" class="oj-ux-ico-apps-grid"></span>
//             <span>Applications</span>
//           </oj-list-item-layout>
//           <oj-list-item-layout
//             id="logs"
//             class={activeItem === 'logs' ? 'sidebar-active' : ''}
//             onClick={() => handleNavigation('/logs', 'logs')}
//           >
//             <span slot="leading" class="oj-ux-ico-log"></span>
//             <span>Logs</span>
//           </oj-list-item-layout>
//           <oj-list-item-layout
//             id="settings"
//             class={activeItem === 'settings' ? 'sidebar-active' : ''}
//             onClick={() => handleNavigation('/settings', 'settings')}
//           >
//             <span slot="leading" class="oj-ux-ico-settings"></span>
//             <span>Settings</span>
//           </oj-list-item-layout>
//         </ul>
//       </oj-navigation-list>
//     {/* </div> */}

//     {/* Sign Out */}
//     {/* <div class="sidebar-signout">
//       <li class="oj-navigationlist-category-divider"></li>
//       <a
//         href="#"
//         onClick={handleSignOut}
//         class="oj-typography-body-sm oj-text-color-danger"
//         style="display: flex; align-items: center; gap: 8px;"
//       >
//         <span class="oj-ux-ico-signout"></span> Sign Out
//       </a>
//     </div> */}
