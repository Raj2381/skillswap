'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(Boolean(conversationId))
  const [error, setError] = useState('')
  useEffect(() => {
    if (!conversationId) { setMessages([]); setLoading(false); return }
    let active = true
    const supabase = createClient()
    const load = async () => { const { data, error: queryError } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true }); if (!active) return; if (queryError) { console.error('Message load error:', queryError); setError('Messages could not be loaded.') } else setMessages((data ?? []) as Record<string, unknown>[]); setLoading(false) }
    void load()
    const channel = supabase.channel(`messages-${conversationId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, payload => setMessages(current => current.some(message => message.id === payload.new.id) ? current : [...current, payload.new as Record<string, unknown>])).subscribe()
    return () => { active = false; void supabase.removeChannel(channel) }
  }, [conversationId])
  return { messages, loading, error }
}
