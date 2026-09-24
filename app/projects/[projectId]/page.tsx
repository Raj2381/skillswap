import Link from 'next/link'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { card, button } from '@/components/client-shell'

type Project = { id: string; request_id: string | null; title: string; description: string; requirements: string | null; budget: number; deadline: string; status: string; progress: number; creator_id: string; created_at: string; updated_at: string }
type Creator = { id: string; name: string | null; username: string | null; avatar_url: string | null; location: string | null }

export default async function ProjectWorkspacePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/projects/${projectId}`)

  const { data: project, error: projectError } = await supabase.from('projects').select('id,request_id,title,description,requirements,budget,deadline,status,progress,creator_id,created_at,updated_at').eq('id', projectId).eq('client_id', user.id).maybeSingle()
  if (projectError) { console.error('Project workspace load error:', { projectId, clientId: user.id, error: projectError }); return <WorkspaceError /> }
  if (!project) notFound()

  const projectRow = project as Project
  const { data: creator, error: creatorError } = await supabase.from('profiles').select('id,name,username,avatar_url,location').eq('id', projectRow.creator_id).eq('role', 'creator').maybeSingle()
  if (creatorError || !creator) console.error('Project creator unavailable:', { projectId: projectRow.id, creatorId: projectRow.creator_id, requestId: projectRow.request_id, error: creatorError })

  const creatorRow = creator as Creator | null
  const creatorName = creatorRow?.name || 'Creator unavailable'
  const initials = creatorRow?.name?.split(/\s+/).map(value => value[0]).join('').slice(0, 2).toUpperCase() || '?'
  const statusLabel = projectRow.status.replace('_', ' ').replace(/\b\w/g, value => value.toUpperCase())

  return <main className="min-h-screen bg-[#12070B] px-5 py-8 text-[#FFF5F6]"><div className="mx-auto max-w-7xl"><Link href="/projects" className="mb-6 inline-flex items-center gap-2 text-sm text-[#D66A84]"><ArrowLeft className="size-4" />Back to My projects</Link><h1 className="mb-8 text-4xl font-semibold">{projectRow.title}</h1><div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><div><section className={`${card} p-6`}><div className="flex items-center justify-between gap-4"><div><p className="text-xs text-[#9F8189]">Project workspace</p><p className="mt-2 text-sm text-[#C7A7B0]">Updated {new Date(projectRow.updated_at).toLocaleDateString()}</p></div><span className="rounded-full bg-[#3A101C] px-3 py-1 text-xs text-[#E7A5B5]">{statusLabel}</span></div><div className="mt-7 h-3 rounded-full bg-[#3A101C]"><div className="h-full rounded-full bg-[#A52546]" style={{ width: `${projectRow.progress}%` }} /></div><p className="mt-2 text-sm text-[#C7A7B0]">{projectRow.progress}% complete · Due {projectRow.deadline}</p><div className="mt-8 grid gap-5 sm:grid-cols-2"><Info label="Description" value={projectRow.description} /><Info label="Requirements" value={projectRow.requirements || 'No additional requirements'} /><Info label="Budget" value={`₹${Number(projectRow.budget).toLocaleString('en-IN')}`} /><Info label="Status" value={statusLabel} /></div></section><section className={`${card} mt-5 p-6`}><h2 className="text-xl font-semibold">Project updates</h2><p className="mt-3 text-sm text-[#C7A7B0]">Progress updates from your creator will appear here.</p></section></div><aside className="space-y-5"><section className={`${card} p-6`}><p className="text-xs uppercase tracking-[.15em] text-[#9F8189]">Creator</p><div className="mt-4 flex items-center gap-3"><div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-[#8F1D3B] font-semibold">{creatorRow?.avatar_url ? <img src={creatorRow.avatar_url} alt={creatorName} className="size-full object-cover" /> : initials}</div><div><h2 className="font-semibold">{creatorName}</h2>{creatorRow?.username && <p className="text-sm text-[#D66A84]">{creatorRow.username}</p>}{creatorRow?.location && <p className="mt-1 text-xs text-[#9F8189]">{creatorRow.location}</p>}</div></div>{creatorRow ? <Link href={`/chat?project=${projectRow.id}`} className={`${button} mt-5 w-full`}><MessageCircle className="size-4" />Message creator</Link> : <p className="mt-5 text-sm text-[#E99AAA]">Creator unavailable</p>}</section></aside></div></div></main>
}

function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs uppercase tracking-[.12em] text-[#9F8189]">{label}</p><p className="mt-2 text-sm leading-6 text-[#C7A7B0]">{value}</p></div> }
function WorkspaceError() { return <main className="min-h-screen bg-[#12070B] px-5 py-20 text-[#FFF5F6]"><div className={`${card} mx-auto max-w-xl p-8 text-center`}><h1 className="text-2xl font-semibold">Unable to load project</h1><p className="mt-3 text-sm text-[#C7A7B0]">Please try again.</p><Link href="/projects" className={`${button} mt-6`}>Back to My projects</Link></div></main> }
