import Link from 'next/link'
import React from 'react'

export default function Header(){
  return (
    <header className="py-6 bg-[rgba(255,255,255,0.03)] backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex items-center justify-between">
        <Link href="/" className="text-2xl font-extrabold" aria-label="Home">My Website</Link>
        <nav className="flex gap-4 items-center">
          <Link href="/features" className="header-link">Features</Link>
          <Link href="/webseries" className="header-link">Web Series</Link>
          <Link href="/videos" className="header-link">Videos</Link>
          <Link href="/ceremony-grounds" className="header-link">Ceremony Grounds</Link>
          <Link href="/contact" className="btn outline">Contact</Link>
        </nav>
      </div>
    </header>
  )
}
