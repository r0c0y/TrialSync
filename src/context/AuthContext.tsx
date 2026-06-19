'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: string
  isDemo?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  loginWithDemo: () => Promise<void>
  loginWithGitHub: () => void
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const userData = await res.json()
        setUser(userData)
        return true
      }
    } catch {
      // ignore
    }
    return false
  }, [])

  useEffect(() => {
    const init = async () => {
      const authed = await fetchUser()
      if (authed) {
        setLoading(false)
        return
      }
      // Auto-login as demo user if not authenticated
      await loginWithDemo()
    }
    init()
  }, [fetchUser])

  const loginWithDemo = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' })
      if (res.ok) {
        const userData = await res.json()
        setUser(userData)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const loginWithGitHub = () => {
    window.location.href = '/api/auth/github'
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    // Re-login as demo
    await loginWithDemo()
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithDemo, loginWithGitHub, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
