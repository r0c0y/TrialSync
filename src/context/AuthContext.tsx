'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  loginWithDemo: () => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('trialsync-auth-token')
        if (token) {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.ok) {
            const userData = await res.json()
            setUser(userData)
            setLoading(false)
            return
          }
          localStorage.removeItem('trialsync-auth-token')
        }
        // Auto-login as demo user
        await loginWithDemo()
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loginWithDemo = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' })
      const data = await res.json()
      setUser(data.user)
      localStorage.setItem('trialsync-auth-token', data.token)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    localStorage.removeItem('trialsync-auth-token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithDemo, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
