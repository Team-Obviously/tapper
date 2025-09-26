import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

const Layout = () => {
  const location = useLocation()

  // Don't show navbar on landing page
  const showNavbar = location.pathname !== '/'

  return (
    <div className="min-h-screen bg-background">
      {/* {showNavbar && <Navbar />} */}
      <main className={showNavbar ? 'lg:ml-64 pb-20 lg:pb-0' : ''}>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
