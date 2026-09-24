'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Check, MapPin, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DashboardShell, SectionTitle, card, button } from '@/components/creator/creator-shell'

type Profile = {
  name: string
  email: string
  username: string
  bio: string
  location: string
  phone: string
  skills: string
  experience: string
  availability: 'available' | 'busy' | 'unavailable'
  avatarUrl: string | null
}

const emptyProfile: Profile = { name: '', email: '', username: '', bio: '', location: '', phone: '', skills: '', experience: '', availability: 'available', avatarUrl: null }

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [draft, setDraft] = useState<Profile>(emptyProfile)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { if (active) { setError('Please log in again.'); setLoading(false) }; return }
      const [{ data: base, error: baseError }, { data: creator, error: creatorError }] = await Promise.all([
        supabase.from('profiles').select('name,email,username,bio,location,phone,avatar_url').eq('id', user.id).single(),
        supabase.from('creator_profiles').select('username,bio,location,experience_years,availability,skills').eq('user_id', user.id).maybeSingle(),
      ])
      if (!active) return
      if (baseError || creatorError) { setError('Unable to load your profile.'); setLoading(false); return }
      const next: Profile = {
        name: base?.name ?? '', email: base?.email ?? user.email ?? '', username: creator?.username ?? base?.username ?? '',
        bio: creator?.bio ?? base?.bio ?? '', location: creator?.location ?? base?.location ?? '', phone: base?.phone ?? '',
        skills: Array.isArray(creator?.skills) ? creator.skills.join(', ') : '', experience: creator?.experience_years == null ? '' : String(creator.experience_years),
        availability: creator?.availability === 'busy' || creator?.availability === 'unavailable' ? creator.availability : 'available', avatarUrl: base?.avatar_url ?? null,
      }
      setProfile(next); setDraft(next); setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [])

  const updateDraft = (field: keyof Profile, value: string) => { setDraft(current => ({ ...current, [field]: value })); setSaved(false) }
  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setSaved(false)
    const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Please log in again.'); setSaving(false); return }
    const skills = draft.skills.split(',').map(value => value.trim()).filter(Boolean)
    const [{ error: baseError }, { error: creatorError }] = await Promise.all([
      supabase.from('profiles').update({ name: draft.name.trim(), username: draft.username.trim() || null, bio: draft.bio.trim(), location: draft.location.trim(), phone: draft.phone.trim() }).eq('id', user.id),
      supabase.from('creator_profiles').upsert({ user_id: user.id, username: draft.username.trim() || null, bio: draft.bio.trim(), location: draft.location.trim(), experience_years: Number.parseInt(draft.experience, 10) || 0, availability: draft.availability, skills }, { onConflict: 'user_id' }),
    ])
    if (baseError || creatorError) { console.error('Creator profile update error:', baseError ?? creatorError); setError('Unable to update your profile.'); setSaving(false); return }
    setProfile({ ...draft, skills: skills.join(', ') }); setDraft(current => ({ ...current, skills: skills.join(', ') })); setEditing(false); setSaved(true); setSaving(false)
  }

  const initials = profile.name.split(/\s+/).map(value => value[0]).join('').slice(0, 2).toUpperCase() || 'C'
  return <DashboardShell>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><SectionTitle title="Profile" subtitle="Manage your public profile and availability." />{!editing && <button className={button} onClick={() => { setDraft(profile); setEditing(true); setSaved(false) }}><Pencil size={14} />Edit Profile</button>}</div>
    {loading ? <div className={`${card} h-72 animate-pulse`} /> : <>
      {error && <p role="alert" className="mb-6 rounded-xl border border-rose-300/25 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p>}
      {saved && <div role="status" className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-300/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"><Check size={16} />Profile updated successfully.</div>}
      <form onSubmit={save} className={`${card} max-w-3xl space-y-5`}>
        <div className="flex items-center gap-4 border-b border-rose-300/10 pb-6"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-400/15 text-xl font-bold text-rose-200">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : initials}</div><div><h2 className="text-lg font-semibold text-white">{profile.name || 'Your name'}</h2><p className="text-sm text-[#b8aec9]">{profile.email}</p><div className="mt-2 flex items-center gap-1 text-xs text-[#b8aec9]"><MapPin size={13} />{profile.location || 'Location not added'}</div></div></div>
        {editing ? <div className="space-y-4"><Field label="Name" value={draft.name} onChange={value => updateDraft('name', value)} /><Field label="Username" value={draft.username} onChange={value => updateDraft('username', value)} /><Field label="Location" value={draft.location} onChange={value => updateDraft('location', value)} /><Field label="Phone" value={draft.phone} onChange={value => updateDraft('phone', value)} /><Field label="Experience (years)" value={draft.experience} onChange={value => updateDraft('experience', value)} type="number" /><Field label="Skills (comma separated)" value={draft.skills} onChange={value => updateDraft('skills', value)} /><label className="block text-xs font-semibold text-white">Bio<textarea value={draft.bio} onChange={event => updateDraft('bio', event.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-rose-300/15 bg-[#24101a] px-3 py-2.5 text-sm font-normal text-white outline-none focus:border-rose-400/60" /></label><label className="block text-xs font-semibold text-white">Availability<select value={draft.availability} onChange={event => updateDraft('availability', event.target.value as Profile['availability'])} className="mt-2 h-10 w-full rounded-xl border border-rose-300/15 bg-[#24101a] px-3 text-sm font-normal text-white"><option value="available">Available</option><option value="busy">Busy</option><option value="unavailable">Unavailable</option></select></label><div className="flex gap-3"><button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-rose-300/20 px-4 py-2.5 text-xs font-semibold text-[#d8cbd2]">Cancel</button><button type="submit" disabled={saving} className={`${button} disabled:opacity-50`}>{saving ? 'Saving...' : 'Save Changes'}</button></div></div> : <div className="grid gap-5 sm:grid-cols-2"><Info label="Bio" value={profile.bio} /><Info label="Username" value={profile.username} /><Info label="Skills" value={profile.skills} /><Info label="Experience" value={profile.experience ? `${profile.experience} years` : 'Not added'} /><Info label="Availability" value={profile.availability} /><Info label="Phone" value={profile.phone} /></div>}
      </form>
    </>}
  </DashboardShell>
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block text-xs font-semibold text-white">{label}<input type={type} value={value} onChange={event => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-rose-300/15 bg-[#24101a] px-3 text-sm font-normal text-white outline-none focus:border-rose-400/60" /></label> }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-semibold text-[#b8aec9]">{label}</p><p className="mt-1 text-sm text-white">{value || 'Not added'}</p></div> }
