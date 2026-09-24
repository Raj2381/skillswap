'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowUpRight, BriefcaseBusiness, DollarSign, Inbox, Star } from 'lucide-react'
import { Avatar, card, CreatorShell } from '@/components/creator/creator-shell'
import { createClient } from '@/lib/supabase/client'

type Project = { id: string; title: string; budget: number; deadline: string; progress: number; status: string; client_id: string }
type Request = { id: string; title: string; budget: number; deadline: string; client_id: string; clientName: string }
type Availability = 'available' | 'busy' | 'unavailable'

export default function DashboardPage() {
  const [name, setName] = useState('Creator')
  const [projects, setProjects] = useState<Project[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [availability, setAvailability] = useState<Availability>('available')
  const [loading, setLoading] = useState(true)
  const [availabilitySaving, setAvailabilitySaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { if (active) { setError('Please log in again.'); setLoading(false) }; return }
      const [{ data: profile }, { data: creator }, { data: projectRows }, { data: requestRows }] = await Promise.all([
        supabase.from('profiles').select('name').eq('id', user.id).maybeSingle(),
        supabase.from('creator_profiles').select('availability').eq('user_id', user.id).maybeSingle(),
        supabase.from('projects').select('id,title,budget,deadline,progress,status,client_id').eq('creator_id', user.id).order('created_at', { ascending: false }),
        supabase.from('project_requests').select('id,title,budget,deadline,client_id').eq('creator_id', user.id).eq('status', 'pending').order('created_at', { ascending: false }),
      ])
      if (!active) return
      setName(profile?.name || user.user_metadata?.name || 'Creator')
      setAvailability(creator?.availability === 'busy' || creator?.availability === 'unavailable' ? creator.availability : 'available')
      setProjects((projectRows ?? []) as Project[])
      const rows = (requestRows ?? []) as Array<{ id: string; title: string; budget: number; deadline: string; client_id: string }>; const clientIds = [...new Set(rows.map(row => row.client_id))]
      const { data: clients } = clientIds.length ? await supabase.from('profiles').select('id,name').in('id', clientIds) : { data: [] as Array<{ id: string; name: string | null }> }
      const clientMap = new Map((clients ?? []).map((client: { id: string; name: string | null }) => [client.id, client.name]))
      setRequests(rows.map(row => ({ ...row, clientName: clientMap.get(row.client_id) || 'Client' })) as Request[])
      setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [])

  const updateAvailability = async (next: Availability) => {
    setAvailabilitySaving(true); setError('')
    const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Please log in again.'); setAvailabilitySaving(false); return }
    const { error: updateError } = await supabase.from('creator_profiles').upsert({ user_id: user.id, availability: next }, { onConflict: 'user_id' })
    if (updateError) { console.error('Availability update error:', updateError); setError('Unable to update availability.'); setAvailabilitySaving(false); return }
    setAvailability(next); setAvailabilitySaving(false)
  }

  const active = projects.filter(project => ['accepted', 'in_progress', 'delivered'].includes(project.status)); const completed = projects.filter(project => project.status === 'completed'); const earnings = completed.reduce((sum, project) => sum + Number(project.budget || 0), 0); const metrics: Array<[string, string, typeof BriefcaseBusiness, string]> = [['Active projects', `${active.length} / 5`, BriefcaseBusiness, '/creator/workspace/projects'], ['Pending requests', String(requests.length), Inbox, '/creator/workspace/requests'], ['Completed earnings', `₹${earnings.toLocaleString('en-IN')}`, DollarSign, '/creator/workspace/history'], ['Projects completed', String(completed.length), Star, '/creator/workspace/history']]
  return <CreatorShell><div className="hero-region hero-first"><p className="header-date mb-2 text-xs font-medium text-[#81758f]">Creator workspace</p><h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#f8f7ff]">Good morning, <span className="bg-gradient-to-r from-rose-300 to-rose-300 bg-clip-text text-transparent">{name.split(/\s+/)[0]}</span></h1><p className="mt-2 text-sm text-[#b8aec9]">Here&apos;s what&apos;s happening with your work today.</p></div>{error && <p role="alert" className="mb-5 rounded-xl border border-rose-300/25 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p>}<section className={`${card} mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center`}><div><p className="text-xs font-semibold uppercase tracking-[.13em] text-[#81758f]">Availability</p><p className="mt-2 text-sm text-white">{availability === 'available' ? 'Available for new projects' : availability === 'busy' ? 'Busy with current projects' : 'Unavailable for new projects'}</p></div><div className="flex gap-2">{(['available', 'busy', 'unavailable'] as Availability[]).map(value => <button key={value} type="button" disabled={availabilitySaving} onClick={() => void updateAvailability(value)} className={`rounded-xl border px-3 py-2 text-xs font-semibold capitalize ${availability === value ? 'border-rose-300/50 bg-rose-400/15 text-rose-100' : 'border-rose-300/15 text-[#b8aec9]'}`}>{value}</button>)}</div></section><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, Icon, href]) => <Link href={href} key={label} className={`${card} group transition hover:-translate-y-1`}><div className="flex items-start justify-between"><div><p className="text-[11px] font-medium uppercase tracking-[0.13em] text-[#81758f]">{label}</p><p className="mt-3 text-[30px] font-semibold text-[#f8f7ff]">{value}</p></div><Icon size={19} className="text-rose-300" /></div></Link>)}</div><div className="mt-8 grid gap-6 xl:grid-cols-[1.55fr_1fr]"><section className={card}><div className="mb-6 flex items-center justify-between"><div><h2 className="text-lg font-semibold text-[#f8f7ff]">Your active projects</h2><p className="mt-1 text-xs text-[#81758f]">Live from your workspace</p></div><Link href="/creator/workspace/projects" className="text-xs font-semibold text-rose-300">View all <ArrowUpRight size={13} className="inline" /></Link></div>{loading ? <div className="h-32 animate-pulse rounded-xl bg-[#24101a]" /> : active.length ? <div className="divide-y divide-rose-300/10">{active.slice(0, 4).map(project => <Link href={`/creator/workspace/projects/${project.id}`} key={project.id} className="flex items-center justify-between gap-4 py-3"><span className="min-w-0"><span className="block truncate text-sm font-semibold text-white">{project.title}</span><span className="text-xs text-[#81758f]">{project.progress}% complete</span></span><span className="text-sm text-rose-200">₹{Number(project.budget).toLocaleString('en-IN')}</span></Link>)}</div> : <p className="py-8 text-sm text-[#b8aec9]">No active projects yet.</p>}</section><section className={card}><div className="mb-6 flex items-center justify-between"><div><h2 className="text-lg font-semibold text-[#f8f7ff]">Recent requests</h2><p className="mt-1 text-xs text-[#81758f]">Waiting for your review</p></div><Link href="/creator/workspace/requests" className="text-xs font-semibold text-rose-300">View all</Link></div>{loading ? <div className="h-32 animate-pulse rounded-xl bg-[#24101a]" /> : requests.length ? <div className="space-y-3">{requests.slice(0, 4).map(request => <Link href="/creator/workspace/requests" key={request.id} className="flex items-center gap-3 rounded-xl bg-[#24101a] p-3"><Avatar initials={request.clientName.slice(0, 2).toUpperCase()} /><span className="min-w-0"><span className="block truncate text-sm font-semibold text-white">{request.title}</span><span className="text-xs text-[#81758f]">{request.clientName}</span></span></Link>)}</div> : <p className="py-8 text-sm text-[#b8aec9]">No pending requests.</p>}</section></div></CreatorShell>
}
