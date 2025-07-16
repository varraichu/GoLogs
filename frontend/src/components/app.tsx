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
// import {SideBar} from './Navbar/SideBar'
import { SideBar } from './Navbar/SideBar'
import { Header } from './header'
import UserApplications from "../views/user-applications/UserApplications";
import { ToastProvider } from '../context/ToastContext'

type Props = {
  appName?: string
  userLogin?: string
}

export const App = registerCustomElement(
  'app-root',
  ({ appName = 'GoLogs', userLogin = 'john.hancock@oracle.com' }: Props) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)
    const [profileUrl, setProfileUrl] = useState('')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(true)
    const [startOpened, setStartOpened] = useState(true)
    const [userId, setUserId] = useState<string>("")
    const [activeItem, setActiveItem] = useState<string>('dashboard')
    const [collapsed, setCollapsed] = useState(true)
    useEffect(() => {
      Context.getPageContext().getBusyContext().applicationBootstrapComplete()

      // Remove all token parsing logic
      const fetchUser = async () => {
        try {
          const res = await fetch('http://localhost:3001/api/oauth/me', {
            method: 'GET',
            credentials: 'include' // 🔥 Required to send cookies
          })

          if (!res.ok) throw new Error('Not authenticated')

          const data = await res.json()
          setIsAuthenticated(true)
          // console.log(data)
          setIsAdmin(data.user.isAdmin)
          setProfileUrl(data.user.picture)
          setUsername(data.user.username)
          setEmail(data.user.email)
          setUserId(data.user._id)
        } catch (err) {
          setIsAuthenticated(false)
        } finally {
          setLoading(false)
        }
      }

      fetchUser()
    }, [])

    if (loading) {
      return <div>Loading...</div> // Better than blank screen
    }

    if (!isAuthenticated) {
      return <Login />
    }
    // const setStartOpen = () => setStartOpened(!startOpened);
    const setStartOpen = () => setCollapsed(!collapsed);
    return (
      <ToastProvider>
        <div>
          <Header appName="GoLogs" userLogin={email} setIsAuthenticated={setIsAuthenticated} setStartOpen={setStartOpen} setActiveItem={setActiveItem}></Header>
          <oj-c-drawer-layout class="oj-web-applayout-page oj-flex" startOpened
            startDisplay="reflow">
            <SideBar
              collapsed={collapsed}
              // slot="start" 
              setActiveItem={setActiveItem}
              activeItem={activeItem}
              setIsAuthenticated={setIsAuthenticated}
              isAdmin={isAdmin}
              pictureUrl={profileUrl}
              username={username}
            />
            <div>
              <Router>
                {/* <Nav isAdmin={isAdmin} setIsAuthenticated={setIsAuthenticated} /> */}
                <Dashboard path="/dashboard" userId={userId} setActiveItem={setActiveItem} />
                <Settings path="/settings" isAdmin={isAdmin} userId={userId} />
                {isAdmin ? (
                  <Applications path="/applications" />
                ) : (
                  <UserApplications path="/user-applications" />
                )}
                <Logs path="/logs" />
                {isAdmin && <UserGroups path="/usergroups" />}
              </Router>
            </div>
          </oj-c-drawer-layout>
        </div>
      </ToastProvider>
    )
  }
)
