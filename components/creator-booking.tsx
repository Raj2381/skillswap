'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Layout, card, button } from '@/components/client-shell'

type Availability = 'available' | 'busy' | 'unavailable'
type Creator = { id: string; name: string; avatar_url: string | null; availability: Availability | null; bio: string | null }
type FormState = { title: string; description: string; requirements: string; budget: string; deadline: string; startDate: string; referenceLinks: string }
const initialForm: FormState = { title: '', description: '', requirements: '', budget: '', deadline: '', startDate: '', referenceLinks: '' }

export function CreatorBookingPage({ creatorId }: { creatorId: string }) {
  const router = useRouter()
  const [creator, setCreator] = useState<Creator | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState<FormState>(initialForm)

  useEffect(() => {
    let active = true
    const load = async () => {
      const supabase = createClient()
      const { data, error: profileError } = await supabase.from('profiles').select('id,name,avatar_url,role').eq('id', creatorId).eq('role', 'creator').maybeSingle()
      if (!active) return
      if (profileError) { console.error('Creator profile error:', profileError); setError('Unable to load creator. Please try again.'); setLoading(false); return }
      if (!data) { setError('Creator not found.'); setLoading(false); return }
      const { data: creatorProfile, error: availabilityError } = await supabase.from('creator_profiles').select('availability,bio').eq('user_id', creatorId).maybeSingle()
      if (!active) return
      if (availabilityError) { console.error('Creator availability error:', availabilityError); setError('Couldn\'t load availability. Please try again.'); setLoading(false); return }
      const availability = creatorProfile?.availability
      if (availability !== undefined && availability !== null && !['available', 'busy', 'unavailable'].includes(availability)) { console.error('Creator availability error: invalid value', availability); setError('Couldn\'t load availability. Please try again.'); setLoading(false); return }
      setCreator({ ...data, availability: availability as Availability | null, bio: creatorProfile?.bio ?? null } as Creator)
      setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [creatorId])

  const update = (key: keyof FormState, value: string) => setForm(current => ({ ...current, [key]: value }))
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!creator || creator.availability === 'busy' || creator.availability === 'unavailable') return
    if (form.startDate && form.deadline < form.startDate) { setError('Deadline must be on or after the preferred start date.'); return }
    setBusy(true); setError('')
    const response = await fetch('/api/project-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, creatorId, budget: Number(form.budget) }) })
    const result = await response.json().catch(() => null)
    if (!response.ok) { setError(result?.error || 'Unable to send the project request.'); setBusy(false); return }
    setSent(true); setBusy(false)
  }

  if (loading) return <Layout title="Start a project"><div className={`${card} p-8`}>Loading creator...</div></Layout>
  if (error && !creator) return <Layout title="Start a project"><div className={`${card} p-8 text-[#E99AAA]`}>{error}<button type="button" onClick={() => window.location.reload()} className="ml-3 underline">Retry</button></div></Layout>
  if (!creator) return null
  if (creator.availability === 'busy' || creator.availability === 'unavailable') return <Layout title="Start a project"><div className={`${card} p-8 text-center`}><h1 className="text-2xl font-semibold">This creator is currently unavailable for new projects.</h1><p className="mt-3 text-sm text-[#9F8189]">This creator is not accepting new project requests right now.</p><button onClick={() => router.back()} className={`${button} mt-6`}>Back to creator</button></div></Layout>

  const availabilityMessage = creator.availability === 'available' ? 'Available for new projects' : "Availability hasn't been configured yet. You can still send a project request."
  return <Layout title="Start a project"><div className="grid gap-6 lg:grid-cols-[1fr_360px]"><section className={`${card} p-6`}>{sent ? <div className="py-12 text-center"><Check className="mx-auto size-10 text-[#72D59A]" /><h1 className="mt-4 text-2xl font-semibold">Request sent successfully!</h1><p className="mt-2 text-sm text-[#C7A7B0]">Your request is waiting for {creator.name}&apos;s response.</p><button onClick={() => router.push('/projects')} className={`${button} mt-6`}>View my projects</button></div> : <form onSubmit={submit} className="grid gap-4"><div><h1 className="text-2xl font-semibold">Start a project with {creator.name}</h1><p className={`mt-2 text-sm ${creator.availability === 'available' ? 'text-emerald-300' : 'text-amber-300'}`}>{availabilityMessage}</p></div><label className="grid gap-2 text-sm">Project title<input required value={form.title} onChange={event => update('title', event.target.value)} className="rounded-xl border border-[#6A2636] bg-[#1A080E] p-3 outline-none" /></label><label className="grid gap-2 text-sm">Project description<textarea required value={form.description} onChange={event => update('description', event.target.value)} className="min-h-32 rounded-xl border border-[#6A2636] bg-[#1A080E] p-3 outline-none" /></label><label className="grid gap-2 text-sm">Additional requirements<textarea value={form.requirements} onChange={event => update('requirements', event.target.value)} className="min-h-24 rounded-xl border border-[#6A2636] bg-[#1A080E] p-3 outline-none" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm">Budget<input required type="number" min="0" value={form.budget} onChange={event => update('budget', event.target.value)} className="rounded-xl border border-[#6A2636] bg-[#1A080E] p-3 outline-none" /></label><label className="grid gap-2 text-sm">Deadline<input required type="date" value={form.deadline} onChange={event => update('deadline', event.target.value)} className="rounded-xl border border-[#6A2636] bg-[#1A080E] p-3 outline-none" /></label></div>{error && <p role="alert" className="text-sm text-[#E99AAA]">{error}</p>}<button disabled={busy} className={`${button} justify-center disabled:opacity-50`}>{busy ? 'Sending request...' : 'Send project request'}</button></form>}</section><aside className={`${card} h-fit`}><p className="text-xs uppercase tracking-[.15em] text-[#D66A84]">Creator</p><h2 className="mt-3 text-xl font-semibold">{creator.name}</h2><p className="mt-3 text-sm leading-6 text-[#C7A7B0]">{creator.bio || 'Creator profile'}</p><p className={`mt-5 text-sm ${creator.availability === 'available' ? 'text-emerald-300' : 'text-amber-300'}`}>{availabilityMessage}</p></aside></div></Layout>
}
