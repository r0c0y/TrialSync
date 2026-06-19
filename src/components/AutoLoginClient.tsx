'use client'

import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

export default function AutoLoginClient() {
  const { user, loading, loginWithDemo } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      loginWithDemo()
    }
  }, [loading, user, loginWithDemo])

  return null
}
