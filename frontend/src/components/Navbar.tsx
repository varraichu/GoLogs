import React from 'react'
import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav style={{ padding: '1rem', background: '#f2f2f2' }}>
      <Link to="/dashboard" style={{ marginRight: '1rem' }}>
        Dashboard
      </Link>
    </nav>
  )
}

export default Navbar
