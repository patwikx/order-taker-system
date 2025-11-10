"use client"

import { useEffect } from "react"

export default function POSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Lock body scroll when POS is mounted
    const originalStyle = {
      overflow: document.body.style.overflow,
      height: document.body.style.height,
      width: document.body.style.width,
      position: document.body.style.position,
    }
    
    document.body.style.overflow = 'hidden'
    document.body.style.height = '100vh'
    document.body.style.width = '100vw'
    document.body.style.position = 'fixed'
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'none'
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = originalStyle.overflow
      document.body.style.height = originalStyle.height
      document.body.style.width = originalStyle.width
      document.body.style.position = originalStyle.position
      document.documentElement.style.overflow = ''
      document.documentElement.style.overscrollBehavior = ''
    }
  }, [])

  return (
    <div className="h-screen w-screen overflow-hidden fixed inset-0">
      {children}
    </div>
  )
}