'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useProjects(userId: string | null, role: 'client' | 'creator') {
  const [projects, setProjects] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState('')
  useEffect(() => {
    if (!userId) { setProjects([]); setLoading(false); return }
    let active = true
    const column = role === 'creator' ? 'creator_id' : 'client_id'
    createClient().from('projects').select('*').eq(column, userId).order('created_at', { ascending: false }).then(({ data, error: queryError }) => { if (!active) return; if (queryError) { console.error('Project load error:', queryError); setError('Projects could not be loaded.') } else setProjects((data ?? []) as Record<string, unknown>[]); setLoading(false) })
    return () => { active = false }
  }, [role, userId])
  return { projects, loading, error }
}
