'use client'

import { useEffect, useState } from 'react'
import { CreatorPage, EmptyState, Pill, primaryButton, secondaryButton } from '@/components/creator-shell'
import { createClient } from '@/lib/supabase/client'

type RequestRow = { id: string; title: string; description: string; budget: number; deadline: string; status: string; created_at: string; client_id: string }

export default function CreatorRequestsPage() {
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data, error: queryError } = await supabase.from('project_requests').select('id,title,description,budget,deadline,status,created_at,client_id').eq('status', 'pending').order('created_at', { ascending: false })
    if (queryError) setError('Something went wrong while loading requests.')
    else setRequests((data ?? []) as RequestRow[])
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  async function decide(id: string, decision: 'accept' | 'decline') {
    setBusy(id)
    setError('')
    const response = await fetch(`/api/project-requests/${id}/decision`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision }) })
    const result = await response.json().catch(() => null)
    if (!response.ok) setError(result?.error ?? 'Unable to update this request.')
    else setRequests(current => current.filter(request => request.id !== id))
    setBusy('')
  }

  return <CreatorPage title="Project requests" eyebrow="Incoming work"><div className="flex items-end justify-between gap-4"><div><p className="text-sm text-white/45">Review requests from clients and decide what is a fit.</p></div><button onClick={() => void load()} className={secondaryButton}>Refresh</button></div>{error && <p role="alert" className="mt-5 rounded-xl border border-[#f2aac6]/30 bg-[#f2aac6]/10 px-4 py-3 text-sm text-[#f2aac6]">{error}</p>}{loading?<div className="mt-8 grid gap-4 lg:grid-cols-2"><div className="h-48 animate-pulse rounded-2xl bg-white/5"/><div className="h-48 animate-pulse rounded-2xl bg-white/5"/></div>:requests.length===0?<div className="mt-8"><EmptyState title="No new requests" description="When clients send you project requests, they will appear here."/></div>:<div className="mt-8 grid gap-4 lg:grid-cols-2">{requests.map(request=><article key={request.id} className="rounded-2xl border border-white/8 bg-white/[0.045] p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs text-white/40">Requested {new Date(request.created_at).toLocaleDateString()}</p><h2 className="mt-2 text-lg font-semibold">{request.title}</h2></div><Pill tone="amber">Pending</Pill></div><p className="mt-4 line-clamp-3 text-sm leading-6 text-white/55">{request.description}</p><div className="mt-5 flex flex-wrap gap-4 text-sm text-white/55"><span>Budget ₹{Number(request.budget).toLocaleString('en-IN')}</span><span>Due {request.deadline}</span></div><div className="mt-5 flex gap-2"><button disabled={busy===request.id} onClick={() => void decide(request.id, 'accept')} className={primaryButton}>Accept request</button><button disabled={busy===request.id} onClick={() => void decide(request.id, 'decline')} className={secondaryButton}>Decline</button></div></article>)}</div>}</CreatorPage>
}
