'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from './client'
import type { User } from '@supabase/supabase-js'
import type { Database } from './database.types'

type SupabaseClient = ReturnType<typeof createClient>

interface SupabaseContextType {
  supabase: SupabaseClient
  user: User | null
  isLoading: boolean
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }
    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <SupabaseContext.Provider value={{ supabase, user, isLoading }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

export function useUser() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a SupabaseProvider')
  }
  return { user: context.user, isLoading: context.isLoading }
}

// Type exports
export type { Database, Tables, TablesInsert, TablesUpdate } from './database.types'
