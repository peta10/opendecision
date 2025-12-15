'use client'

import { ReactNode } from 'react'
import { ScrollToTop } from './ScrollToTop'
import { PostHogProvider } from './PostHogProvider'

// Import error suppression to handle browser extension errors
import '@/lib/errorSuppression'

// Import error suppression test in development
if (process.env.NODE_ENV === 'development') {
  import('@/lib/testErrorSuppression')
}

interface ClientProvidersProps {
  children: ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <PostHogProvider>
      <ScrollToTop />
      {children}
    </PostHogProvider>
  )
}
