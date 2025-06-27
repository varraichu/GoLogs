// import React from 'react'
// import Navbar from './Navbar'
// import { Outlet } from 'react-router-dom'

// const Layout = () => {
//   return (
//     <>
//       <Navbar />
//       <main>
//         <Outlet />
//       </main>
//     </>
//   )
// }

// export default Layout

import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const Layout = () => {
  return (
    <div>
      {/* Basic Navigation (optional) */}
      <nav style={{ padding: '10px', background: '#eee' }}>
        <Link to="/dashboard" style={{ marginRight: 10 }}>Dashboard</Link>
        <Link to="/logstab" style={{ marginRight: 10 }}>Logs</Link>
        <Link to="/usergroups" style={{ marginRight: 10 }}>User Groups</Link>
        <Link to="/applications" style={{ marginRight: 10 }}>Applications</Link>
        <Link to="/settings">Settings</Link>
      </nav>

      {/* Main content */}
      <main style={{ padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
