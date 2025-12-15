'use client'

import { useEffect, useState } from 'react'

export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY
      setScrollPosition(position)
      setIsScrolled(position > 20)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Set initial position

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return { scrollPosition, isScrolled }
}