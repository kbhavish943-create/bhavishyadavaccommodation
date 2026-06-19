import React from 'react'
import Header from './Header'

const Layout: React.FC<{children?: React.ReactNode}> = ({ children }) => {
  return (
    <div>
      <Header />
      <main className="container py-12">{children}</main>
      <footer className="bg-[rgba(255,255,255,0.03)] py-8 mt-12">
        <div className="container text-center text-sm text-gray-300">© {new Date().getFullYear()} My Website</div>
      </footer>
    </div>
  )
}

export default Layout
