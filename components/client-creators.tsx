'use client'

import Link from 'next/link'
import { CheckCircle2, Heart, MessageCircle, Search, SlidersHorizontal, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/client-shell'
import { Layout } from '@/components/client-layout'
import { card, button } from '@/components/client-shell'

const categories = ['All', 'Video & Animation', 'Graphic Design', 'UI/UX Design', 'Web Development', 'Mobile Development', 'Photography', 'Writing', 'Marketing', 'Social Media']
type Creator = { id: string; name: string; avatar_url: string | null; bio: string; location: string; category: string; skills: string[]; price: number | null; rating: number | null; reviews: number; projects: number; availability: string | null; saved: boolean }

function CreatorSkeleton() { return <div className={`${card} h-[390px] animate-pulse p-5`}><div className="flex gap-4"><span className="size-14 rounded-2xl bg-[#3A101C]" /><div className="flex-1"><div className="h-4 w-2/3 rounded bg-[#3A101C]" /><div className="mt-2 h-3 w-1/2 rounded bg-[#3A101C]" /></div></div><div className="mt-6 h-4/5 rounded bg-[#3A101C]" /></div> }

function CreatorCard({ creator, onSave }: { creator: Creator; onSave: (id: string) => void }) {
  const initials = creator.name.split(/\s+/).map(value => value[0]).join('').slice(0, 2).toUpperCase()
  return <article className={`${card} flex min-h-[390px] flex-col p-5 transition duration-150 hover:-translate-y-0.5 hover:border-[#6A2636]`}><div className="flex items-start gap-4"><div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#8F1D3B] font-semibold">{creator.avatar_url ? <img src={creator.avatar_url} alt={creator.name} className="size-full object-cover" /> : initials}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-1"><h2 className="truncate font-semibold">{creator.name}</h2><CheckCircle2 className="size-4 text-[#D66A84]" aria-label="Verified creator" /></div><p className="text-sm text-[#D66A84]">{creator.category}</p><p className="mt-2 truncate text-xs text-[#9F8189]">{creator.location || 'Location not provided'}</p></div><button onClick={() => onSave(creator.id)} aria-label={creator.saved ? `Remove ${creator.name} from saved creators` : `Save ${creator.name}`} className="rounded-full border border-[#6A2636] p-2 text-[#D66A84] hover:bg-[#3A101C]"><Heart className={`size-4 ${creator.saved ? 'fill-current' : ''}`} /></button></div><p className="mt-5 line-clamp-3 min-h-[72px] text-sm leading-6 text-[#C7A7B0]">{creator.bio || 'This creator has not added a bio yet.'}</p><div className="mt-4 flex min-h-7 flex-wrap gap-2">{creator.skills.slice(0, 3).map(skill => <span key={skill} className="rounded-full border border-[#6A2636] px-2.5 py-1 text-[11px] text-[#D9A4B0]">{skill}</span>)}</div><div className="mt-5 flex items-center justify-between text-sm"><span className="flex items-center gap-1">{creator.rating ? <><Star className="size-4 fill-[#D66A84] text-[#D66A84]" />{creator.rating.toFixed(1)} <span className="text-[#9F8189]">({creator.reviews})</span></> : <span className="text-[#9F8189]">New</span>}</span><span className="text-[#C7A0AA]">{creator.price === null ? 'Pricing unavailable' : `from ₹${creator.price.toLocaleString('en-IN')}`}</span></div><div className="mt-2 flex items-center justify-between text-xs text-[#9F8189]"><span>{creator.projects} completed</span><span className="rounded-full bg-[#3A101C] px-2.5 py-1 text-[#E7A5B5]">{creator.availability === 'available' ? 'Available' : creator.availability === 'busy' ? 'Busy' : 'Availability not set'}</span></div><div className="mt-auto grid grid-cols-[1fr_1fr_auto] gap-2 pt-5"><Link href={`/creators/${creator.id}`} className={`${button} w-full`}>View profile</Link><Link href={`/creators/${creator.id}/book`} className="inline-flex items-center justify-center rounded-xl border border-[#6A2636] px-3 py-2 text-sm text-[#E7A5B5]">Book</Link><Link href={`/chat/${creator.id}`} aria-label={`Message ${creator.name}`} className="inline-flex items-center justify-center rounded-xl border border-[#6A2636] px-3 py-2 text-[#E7A5B5]"><MessageCircle className="size-4" /></Link></div></article>
}

export function ClientCreatorsPage() {
  const { profile, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const query = searchParams.get('q') ?? ''
  const category = searchParams.get('category') ?? 'All'
  const sort = searchParams.get('sort') ?? 'Recommended'
  const [draftQuery, setDraftQuery] = useState(query)

  useEffect(() => { setDraftQuery(query) }, [query])
  const searchQuery = searchParams.toString()
  useEffect(() => { const timer = window.setTimeout(() => { const params = new URLSearchParams(searchQuery); if (draftQuery.trim()) params.set('q', draftQuery.trim()); else params.delete('q'); const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname; const currentUrl = searchQuery ? `${pathname}?${searchQuery}` : pathname; if (nextUrl !== currentUrl) router.replace(nextUrl) }, 350); return () => window.clearTimeout(timer) }, [draftQuery, pathname, router, searchQuery])
  useEffect(() => {
    if (authLoading || !profile) return
    let active = true
    const load = async () => {
      setLoading(true); setError('')
      const supabase = createClient()
      const [{ data: profiles, error: profilesError }, { data: creatorProfiles }, { data: services }, { data: links }, { data: skills }, { data: projects }, { data: saved }] = await Promise.all([
        supabase.from('profiles').select('id,name,avatar_url,role').eq('role', 'creator'),
        supabase.from('creator_profiles').select('user_id,bio,location,availability'),
        supabase.from('services').select('creator_id,price'),
        supabase.from('creator_skills').select('creator_id,skill_id'),
        supabase.from('skills').select('id,name'),
        supabase.from('projects').select('creator_id,status'),
        supabase.from('saved_creators').select('creator_id').eq('client_id', profile.id),
      ])
      if (profilesError) { if (active) { setError('Creators could not be loaded. Apply the client marketplace migration, then retry.'); setCreators([]); setLoading(false) }; return }
      const creatorRows = profiles ?? []; const creatorInfo = new Map((creatorProfiles ?? []).map(row => [row.user_id, row])); const skillNames = new Map((skills ?? []).map(row => [row.id, row.name])); const skillMap = new Map<string, string[]>(); (links ?? []).forEach(row => skillMap.set(row.creator_id, [...(skillMap.get(row.creator_id) ?? []), skillNames.get(row.skill_id) ?? ''].filter(Boolean))); const serviceMap = new Map<string, number[]>(); (services ?? []).forEach(row => serviceMap.set(row.creator_id, [...(serviceMap.get(row.creator_id) ?? []), Number(row.price)])); const projectMap = new Map<string, number>(); (projects ?? []).filter(row => row.status === 'completed').forEach(row => projectMap.set(row.creator_id, (projectMap.get(row.creator_id) ?? 0) + 1)); const savedIds = new Set((saved ?? []).map(row => row.creator_id));
      const rows = creatorRows.map(row => { const info = creatorInfo.get(row.id); const prices = (serviceMap.get(row.id) ?? []).filter(price => Number.isFinite(price)); const completed = projectMap.get(row.id) ?? 0; return { id: row.id, name: row.name || 'Unnamed creator', avatar_url: row.avatar_url, bio: info?.bio ?? '', location: info?.location ?? '', category: skillMap.get(row.id)?.[0] ?? 'Creator', skills: skillMap.get(row.id) ?? [], price: prices.length ? Math.min(...prices) : null, rating: null, reviews: 0, projects: completed, availability: info?.availability ?? null, saved: savedIds.has(row.id) } })
      if (active) { setCreators(rows); setLoading(false) }
    }
    void load(); return () => { active = false }
  }, [authLoading, profile])

  const updateParams = (key: string, value: string) => { const params = new URLSearchParams(searchParams.toString()); if (value && value !== 'All' && value !== 'Recommended') params.set(key, value); else params.delete(key); router.replace(`${pathname}?${params.toString()}`) }
  const filtered = useMemo(() => creators.filter(creator => (category === 'All' || creator.category === category) && `${creator.name} ${creator.category} ${creator.skills.join(' ')} ${creator.bio}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'Price: Low to High' ? (a.price ?? Infinity) - (b.price ?? Infinity) : sort === 'Price: High to Low' ? (b.price ?? -1) - (a.price ?? -1) : sort === 'Rating' ? (b.rating ?? -1) - (a.rating ?? -1) : 0), [category, creators, query, sort])
  const savedCount = creators.filter(creator => creator.saved).length
  const toggleSaved = async (id: string) => { if (!profile) return; const before = creators; const current = creators.find(creator => creator.id === id); if (!current) return; setCreators(rows => rows.map(creator => creator.id === id ? { ...creator, saved: !creator.saved } : creator)); const supabase = createClient(); const result = current.saved ? await supabase.from('saved_creators').delete().eq('client_id', profile.id).eq('creator_id', id) : await supabase.from('saved_creators').insert({ client_id: profile.id, creator_id: id }); if (result.error) setCreators(before) }
  const clearFilters = () => router.replace(pathname)

  return <Layout><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[.18em] text-[#D66A84]">DISCOVER TALENT</p><h1 className="mt-3 text-4xl font-semibold">Find your next creator.</h1><p className="mt-3 max-w-2xl text-[#C7A7B0]">Browse independent creators who can turn your next idea into something real.</p></div><div className="grid gap-3 md:grid-cols-[1fr_auto]"><div className="relative"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#9F8189]" /><input value={draftQuery} onChange={event => setDraftQuery(event.target.value)} placeholder="Search creators by skill, service, or name..." className="w-full rounded-xl border border-[#6A2636] bg-[#1A080E] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#D66A84]" /></div><select value={sort} onChange={event => updateParams('sort', event.target.value)} className="rounded-xl border border-[#6A2636] bg-[#1A080E] px-4 py-3 text-sm"><option>Recommended</option><option>Rating</option><option>Price: Low to High</option><option>Price: High to Low</option><option>Newest</option></select></div><div className="mt-5 flex gap-2 overflow-x-auto pb-2">{categories.map(value => <button key={value} onClick={() => updateParams('category', value)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm ${category === value ? 'border-[#D66A84] bg-[#A52546] text-white' : 'border-[#6A2636] text-[#C7A7B0]'}`}>{value}</button>)}</div><div className="mt-5 flex items-center justify-between text-sm text-[#9F8189]"><span>{filtered.length} creators available · {savedCount} saved</span><button onClick={clearFilters} className="inline-flex items-center gap-2 md:hidden"><SlidersHorizontal className="size-4" />Clear filters</button></div>{error && <div className="mt-6 rounded-xl border border-[#D65C6F]/40 bg-[#D65C6F]/10 p-4 text-sm text-[#E99AAA]">{error} <button onClick={() => window.location.reload()} className="ml-2 underline">Retry</button></div>}{loading || authLoading ? <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map(value => <CreatorSkeleton key={value} />)}</div> : filtered.length ? <div className="mt-5 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map(creator => <CreatorCard key={creator.id} creator={creator} onSave={toggleSaved} />)}</div> : <div className={`${card} mt-5 p-12 text-center`}><h2 className="text-xl font-semibold">No creators match your search</h2><p className="mt-2 text-sm text-[#9F8189]">Try another skill or clear your filters.</p><button onClick={clearFilters} className={`${button} mt-6`}>Clear filters</button></div>}</Layout>
}
