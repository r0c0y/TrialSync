'use client'

import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1 rounded-sm border border-border hover:bg-surface transition-colors"
      >
        <img
          src={user.avatar}
          alt={user.name}
          className="w-5 h-5 rounded-full"
        />
        <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-foreground hidden sm:inline">
          {user.name.split(' ')[0]}
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-background border border-border rounded-sm shadow-xl">
            <div className="p-3 border-b border-border">
              <p className="text-xs font-semibold text-foreground">{user.name}</p>
              <p className="text-[10px] text-muted">{user.email}</p>
              <p className="text-[10px] text-muted mt-0.5">{user.role}</p>
            </div>
            <div className="p-2">
              <button
                onClick={() => { logout(); setOpen(false) }}
                className="w-full text-left px-2 py-1.5 text-xs text-muted hover:text-foreground hover:bg-surface rounded transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
