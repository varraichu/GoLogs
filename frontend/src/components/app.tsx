// src/components/app.tsx
import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { registerCustomElement } from 'ojs/ojvcomponent'
import { route, Router } from 'preact-router'
import 'oj-c/drawer-layout'
import Login from '../views/login/Login'
import Dashboard from '../views/dashboard/Dashboard'
import Settings from '../views/settings/Settings'
import Applications from '../views/applications/Applications'
import Logs from '../views/app-logs/Logs'
import UserGroups from '../views/user-groups/UserGroups'
import Context = require('ojs/ojcontext')
import { SideBar } from './Navbar/SideBar'
import { Header } from './header'
import UserApplications from "../views/user-applications/UserApplications"
import { ToastProvider } from '../context/ToastContext'
import { UserProvider, useUser } from '../context/UserContext'

type Props = {
  appName?: string
  userLogin?: string
}

// Main app content component (wrapped by UserProvider)
const AppContent = ({ appName }: { appName: string }) => {
  const { user, isAuthenticated, isLoading } = useUser()
  const [startOpened, setStartOpened] = useState(true)
  const [activeItem, setActiveItem] = useState<string>('dashboard')
  const [collapsed, setCollapsed] = useState(true)

  // Initialize Oracle JET context
  useEffect(() => {
    Context.getPageContext().getBusyContext().applicationBootstrapComplete()
  }, [])

    useEffect(() => {
    if (user) {
      console.log('User data in AppContent:', user)
      console.log('Picture URL being passed to SideBar:', user.picture)
    }
  }, [user])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated || !user) {
    return <Login />
  }

  const setStartOpen = () => setCollapsed(!collapsed)

  return (
    <ToastProvider>
      <div>
        <Header 
          appName={appName} 
          userLogin={user.email} 
          setStartOpen={setStartOpen} 
          setActiveItem={setActiveItem}
        />
        <oj-c-drawer-layout class="oj-web-applayout-page oj-flex" startOpened startDisplay="reflow">
          <SideBar
            collapsed={collapsed}
            setActiveItem={setActiveItem}
            activeItem={activeItem}
            isAdmin={user.isAdmin}
            pictureUrl={user.picture}
            username={user.username}
          />
          <div>
            <Router>
              <Dashboard 
                path="/dashboard" 
                userId={user._id} 
                setActiveItem={setActiveItem} 
              />
              <Settings 
                path="/settings" 
                isAdmin={user.isAdmin} 
                userId={user._id} 
              />
              {user.isAdmin ? (
                <Applications path="/applications" />
              ) : (
                <UserApplications path="/user-applications" userId={user._id} />
              )}
              <Logs path="/logs" />
              {user.isAdmin && <UserGroups path="/usergroups" />}
            </Router>
          </div>
        </oj-c-drawer-layout>
      </div>
    </ToastProvider>
  )
}

// Root component with UserProvider
export const App = registerCustomElement(
  'app-root',
  ({ appName = 'GoLogs' }: Props) => {
    return (
      <UserProvider>
        <AppContent appName={appName} />
      </UserProvider>
    )
  }
)