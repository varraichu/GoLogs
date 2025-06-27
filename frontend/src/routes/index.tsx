// import React from 'react'
// import { Routes, Route } from 'react-router-dom'
// import Login from '../pages/Login'
// import Dashboard from '../pages/Dashboard'
// import LogsTab from '../pages/LogsTab'
// import UserGroups from '../pages/UserGroups'
// import Settings from '../pages/Settings'
// import Applications from '../pages/Applications'
// import NotFound from '../pages/NotFound'
// import Layout from '../components/Layouts'

// const AppRoutes = () => {
//   return (
//     <Routes>
//       <Route element={<Layout />}>
//         <Route path="/" element={<Login />} />
//         <Route path="/dashboard" element={<Dashboard />} />
//         <Route path="/logstab" element={<LogsTab />} />
//         <Route path="/usergroups" element={<UserGroups />} />
//         <Route path="/settings" element={<Settings />} />
//         <Route path="/applications" element={<Applications />} />
//         <Route path="/notfound" element={<NotFound />} />
//       </Route>
//     </Routes>
//   )
// }

// export default AppRoutes

import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import LogsTab from '../pages/LogsTab'
import UserGroups from '../pages/UserGroups'
import Settings from '../pages/Settings'
import Applications from '../pages/Applications'
import NotFound from '../pages/NotFound'
import Layout from '../components/Layouts'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Login />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="logstab" element={<LogsTab />} />
        <Route path="usergroups" element={<UserGroups />} />
        <Route path="settings" element={<Settings />} />
        <Route path="applications" element={<Applications />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
