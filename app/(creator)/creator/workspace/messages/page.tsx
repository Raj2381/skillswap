'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CreatorShell, Avatar, card, SectionTitle } from '@/components/creator/creator-shell'

type Conversation = { id: string; client_id: string; project_id: string | null; updated_at: string; clientName: string; lastMessage: string; unread: number }
type Message = { id: string; sender_id: string; body: string; created_at: string; read_at: string | null }

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [active, setActive] = useState('')
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadConversations = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data: rows, error: conversationError } = await supabase.from('conversations').select('id,client_id,project_id,updated_at').eq('creator_id', user.id).order('updated_at', { ascending: false })
    if (conversationError) { console.error('Creator conversation error:', conversationError); setError('Unable to load messages.'); setLoading(false); return }
    const conversationsRows = (rows ?? []) as Array<{ id: string; client_id: string; project_id: string | null; updated_at: string }>
    const ids = conversationsRows.map(row => row.client_id)
    const clientResult = ids.length ? await supabase.from('profiles').select('id,name').in('id', ids) : { data: [] as Array<{ id: string; name: string | null }> }
    const clients = (clientResult.data ?? []) as Array<{ id: string; name: string | null }>
    const clientMap = new Map(clients.map((client: { id: string; name: string | null }) => [client.id, client.name]))
    const enriched = await Promise.all(conversationsRows.map(async row => {
      const { data: last } = await supabase.from('messages').select('body').eq('conversation_id', row.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('conversation_id', row.id).neq('sender_id', user.id).is('read_at', null)
      return { ...row, clientName: clientMap.get(row.client_id) || 'Client', lastMessage: last?.body || 'No messages yet.', unread: count || 0 }
    }))
    setConversations(enriched as Conversation[]); setActive(current => current || enriched[0]?.id || ''); setLoading(false)
  }

  useEffect(() => { void loadConversations() }, [])

  useEffect(() => {
    if (!active || !userId) { setMessages([]); return }
    const supabase = createClient()
    const markIncomingRead = async () => { await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('conversation_id', active).neq('sender_id', userId).is('read_at', null); setConversations(current => current.map(item => item.id === active ? { ...item, unread: 0 } : item)) }
    const load = async () => { const { data, error: messageError } = await supabase.from('messages').select('id,sender_id,body,created_at,read_at').eq('conversation_id', active).order('created_at', { ascending: true }); if (messageError) setError('Unable to load messages.'); else { setMessages((data ?? []) as Message[]); await markIncomingRead() } }
    void load()
    const channel = supabase.channel(`creator-messages-${active}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${active}` }, (payload: { new: Message }) => { const message = payload.new; setMessages(current => current.some(item => item.id === message.id) ? current : [...current, message]); if (message.sender_id !== userId) void supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', message.id).eq('conversation_id', active).is('read_at', null) }).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${active}` }, (payload: { new: Message }) => { const message = payload.new; setMessages(current => current.map(item => item.id === message.id ? { ...item, read_at: message.read_at } : item)) }).subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [active, userId])

  const visible = useMemo(() => conversations.filter(item => `${item.clientName} ${item.lastMessage}`.toLowerCase().includes(query.toLowerCase())), [conversations, query])
  const current = conversations.find(item => item.id === active)
  const send = async () => { const body = draft.trim(); if (!body || !active || !userId) return; setDraft(''); const { data, error: sendError } = await createClient().from('messages').insert({ conversation_id: active, sender_id: userId, body }).select('id,sender_id,body,created_at,read_at').single(); if (sendError) { setDraft(body); setError('Message failed to send.'); return } setMessages(currentMessages => [...currentMessages, data as Message]); setConversations(currentConversations => currentConversations.map(item => item.id === active ? { ...item, lastMessage: body, updated_at: new Date().toISOString() } : item)) }

  return <CreatorShell><SectionTitle title="Messages" subtitle="Stay connected with your clients and collaborators." />{error && <p role="alert" className="mb-4 rounded-xl border border-rose-300/25 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p>}<div className={`${card} grid min-h-[520px] overflow-hidden p-0 lg:grid-cols-[280px_1fr]`}><aside className="border-r border-rose-300/10 bg-[#24101a]"><div className="border-b border-rose-300/10 p-4"><div className="relative"><Search className="absolute left-3 top-2.5 text-[#81758f]" size={15} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search conversations..." className="h-9 w-full rounded-xl border border-rose-300/15 bg-[#32131f] pl-9 pr-3 text-xs text-white outline-none" /></div></div>{loading ? <div className="space-y-2 p-4"><div className="h-14 animate-pulse rounded-xl bg-[#32131f]" /><div className="h-14 animate-pulse rounded-xl bg-[#32131f]" /></div> : visible.length ? visible.map(item => <button key={item.id} onClick={() => { setActive(item.id); setConversations(currentConversations => currentConversations.map(conversation => conversation.id === item.id ? { ...conversation, unread: 0 } : conversation)) }} className={`flex w-full items-center gap-3 border-b border-rose-300/10 p-4 text-left ${active === item.id ? 'bg-rose-400/10' : 'hover:bg-rose-400/5'}`}><Avatar initials={item.clientName.slice(0, 2).toUpperCase()} /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-white">{item.clientName}</span><span className="block truncate text-[11px] text-[#b8aec9]">{item.lastMessage}</span></span>{item.unread > 0 && <b className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] text-white">{item.unread}</b>}</button>) : <p className="p-5 text-sm text-[#b8aec9]">No conversations yet. Clients can message you from their creator profile.</p>}</aside><section className="flex flex-col bg-[#16080d]">{current ? <><header className="border-b border-rose-300/10 p-5"><p className="font-semibold text-white">{current.clientName}</p><p className="mt-1 text-xs text-rose-300">Client conversation</p></header><div className="flex-1 space-y-3 overflow-y-auto p-5">{messages.length ? messages.map(message => { const outgoing = message.sender_id === userId; return <div key={message.id} className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm ${outgoing ? 'ml-auto bg-[#A52546] text-white' : 'bg-[#32131f] text-[#f8f7ff]'}`}><p>{message.body}</p><time className={`mt-1 block text-[10px] opacity-60 ${outgoing && message.read_at ? 'text-[#F08BA7]' : ''}`}>{new Date(message.created_at).toLocaleString()} {outgoing && <span aria-label={message.read_at ? 'Read' : 'Delivered'}>✓✓</span>}</time></div> }) : <p className="py-16 text-center text-sm text-[#9F8189]">No messages yet. Start the conversation.</p>}</div><div className="border-t border-rose-300/10 p-4"><div className="flex gap-2"><input value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); void send() } }} placeholder="Write a message..." className="h-11 min-w-0 flex-1 rounded-xl border border-rose-300/15 bg-[#24101a] px-3 text-sm text-white outline-none" /><button onClick={() => void send()} className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-600 text-white" aria-label="Send message"><Send size={17} /></button></div></div></> : <div className="flex flex-1 items-center justify-center p-6 text-sm text-[#b8aec9]">Select a conversation to start messaging.</div>}</section></div></CreatorShell>
}
