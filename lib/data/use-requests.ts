'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRequests(userId: string | null, role: 'client' | 'creator') {
  const [requests, setRequests] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState('')
  useEffect(() => {
    if (!userId) { setRequests([]); setLoading(false); return }
    let active = true
    const load = async () => {
      const column = role === 'creator' ? 'creator_id' : 'client_id'
      const { data, error: queryError } = await createClient().from('project_requests').select('*').eq(column, userId).order('created_at', { ascending: false })
      if (!active) return
      if (queryError) { console.error('Request load error:', queryError); setError('Requests could not be loaded.') } else setRequests((data ?? []) as Record<string, unknown>[])
      setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [role, userId])
  return { requests, loading, error }
}
