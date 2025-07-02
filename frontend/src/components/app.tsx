import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { registerCustomElement } from 'ojs/ojvcomponent'
import { route, Router } from 'preact-router'
import 'oj-c/drawer-layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Applications from './pages/Applications'
import Logs from './pages/Logs'
import UserGroups from './pages/UserGroups'
import Nav from './Nav'
import Context = require('ojs/ojcontext')
// import {SideBar} from './Navbar/SideBar'
import { SideBar } from './Navbar/SideBar'
import { set } from 'mongoose'

type Props = {
  appName?: string
  userLogin?: string
}

export const App = registerCustomElement(
  'app-root',
  ({ appName = 'GoLogs', userLogin = 'john.hancock@oracle.com' }: Props) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)
    const [profileUrl, setProfileUrl] = useState("")
    const [username, setUsername] = useState("")
    const [loading, setLoading] = useState(true)
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

    return (
      <div>
        <oj-c-drawer-layout class="oj-web-applayout-page oj-flex" startOpened={true}>
          <SideBar setIsAuthenticated={setIsAuthenticated} isAdmin={isAdmin} pictureUrl={profileUrl} username={username}  />
          <div>
          <Router>
            {/* <Nav isAdmin={isAdmin} setIsAuthenticated={setIsAuthenticated} /> */}
            <Dashboard path="/dashboard" />
            <Settings path="/settings" />
            <Applications path="/applications" />
            <Logs path="/logs" />
            {isAdmin && <UserGroups path="/usergroups" />}
          </Router> 

          </div>

        </oj-c-drawer-layout>
      </div>
    )
  }
)
