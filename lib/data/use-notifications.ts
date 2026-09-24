'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type AppNotification = { id: string; title: string; message: string; created_at: string; is_read: boolean; project_id: string | null; request_id: string | null }

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState('')
  useEffect(() => {
    if (!userId) { setNotifications([]); setLoading(false); return }
    let active = true
    const supabase = createClient()
    const load = async () => {
      const { data, error: queryError } = await supabase.from('notifications').select('id,title,message,created_at,is_read,project_id,request_id').eq('user_id', userId).order('created_at', { ascending: false })
      if (!active) return
      if (queryError) { console.error('Notification load error:', queryError); setError('Notifications could not be loaded.'); setLoading(false); return }
      setNotifications((data ?? []) as AppNotification[]); setLoading(false)
    }
    void load()
    const channel = supabase.channel(`notifications-${userId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => void load()).subscribe()
    return () => { active = false; void supabase.removeChannel(channel) }
  }, [userId])
  const markAllRead = async () => { if (!userId) return; const { error: updateError } = await createClient().from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false); if (updateError) { setError('Notifications could not be updated.'); return } setNotifications(current => current.map(item => ({ ...item, is_read: true }))) }
  return { notifications, unreadCount: notifications.filter(item => !item.is_read).length, loading, error, markAllRead }
}
