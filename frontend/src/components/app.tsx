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
import { ToastProvider} from '../context/ToastContext'

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
    useEffect(() => {
      Context.getPageContext().getBusyContext().applicationBootstrapComplete()

      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')

      const processToken = (token: string) => {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          localStorage.setItem('jwt', token)
          setIsAuthenticated(true)
          setIsAdmin(payload.isAdmin)
          setProfileUrl(payload.picture_url)
          setUsername(payload.username)
          setEmail(payload.email)
          setUserId(payload._id)
        } catch (err) {
          console.error('Invalid JWT token', err)
        }
      }

      if (token) {
        processToken(token)
        // Remove token from URL
        const newUrl = window.location.origin + '/dashboard'
        window.history.replaceState({}, '', newUrl)
        setLoading(false)
      } else {
        const storedToken = localStorage.getItem('jwt')
        if (storedToken) {
          processToken(storedToken)
        }
        setLoading(false)
      }
    }, [])

    if (loading) {
      return <div>Loading...</div> // Better than blank screen
    }

    if (!isAuthenticated) {
      return <Login />
    }
    const setStartOpen = ()=>setStartOpened(!startOpened);
    return (
      <ToastProvider>
      <div>
        <Header appName="GoLogs" userLogin={email} setIsAuthenticated={setIsAuthenticated} setStartOpen={setStartOpen}></Header>
        <oj-c-drawer-layout class="oj-web-applayout-page oj-flex" startOpened={startOpened}>
          <SideBar
          // slot="start" 
            setIsAuthenticated={setIsAuthenticated}
            isAdmin={isAdmin}
            pictureUrl={profileUrl}
            username={username}
          />
          <div>
            <Router>
              {/* <Nav isAdmin={isAdmin} setIsAuthenticated={setIsAuthenticated} /> */}
              <Dashboard path="/dashboard" />
              <Settings path="/settings" isAdmin={isAdmin} userId={userId}/>
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
