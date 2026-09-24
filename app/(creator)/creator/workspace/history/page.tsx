'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DashboardShell, SectionTitle, card } from '@/components/creator/creator-shell'

type Project = { id: string; title: string; budget: number; status: string; completed_at: string | null; created_at: string }
type Payment = { id: string; project_id: string; amount: number; status: string; updated_at: string }

export default function HistoryPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { if (active) { setError('Please log in again.'); setLoading(false) }; return }
      const [{ data: projectRows, error: projectError }, { data: paymentRows, error: paymentError }] = await Promise.all([
        supabase.from('projects').select('id,title,budget,status,completed_at,created_at').eq('creator_id', user.id).order('created_at', { ascending: false }),
        supabase.from('payments').select('id,project_id,amount,status,updated_at').eq('payee_id', user.id).order('updated_at', { ascending: false }),
      ])
      if (!active) return
      if (projectError || paymentError) setError('History and earnings could not be loaded.')
      setProjects((projectRows ?? []) as Project[]); setPayments((paymentRows ?? []) as Payment[]); setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [])

  const completed = projects.filter(project => project.status === 'completed')
  const paid = payments.filter(payment => payment.status === 'paid')
  const pending = payments.filter(payment => payment.status === 'pending' || payment.status === 'processing')
  const totalPaid = paid.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const pendingAmount = pending.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const projectNames = new Map(projects.map(project => [project.id, project.title]))

  return <DashboardShell><SectionTitle title="History & Earnings" subtitle="Review your completed work and database-recorded payments." />{loading ? <div className={`${card} h-64 animate-pulse`} /> : <>{error && <p role="alert" className="mb-6 rounded-xl border border-rose-300/25 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p>}<div className="grid gap-4 sm:grid-cols-3"><Metric label="Total earned" value={`₹${totalPaid.toLocaleString('en-IN')}`} /><Metric label="Pending payments" value={`₹${pendingAmount.toLocaleString('en-IN')}`} /><Metric label="Completed projects" value={String(completed.length)} /></div><div className={`${card} mt-6`}><h2 className="text-[15px] font-semibold">Recent payments</h2>{payments.length === 0 ? <p className="py-10 text-sm text-[#99958e]">No payment records yet.</p> : payments.map(payment => <div className="flex items-center justify-between border-b border-rose-300/10 py-4 last:border-0" key={payment.id}><span><span className="block text-sm font-semibold">{projectNames.get(payment.project_id) || 'Project payment'}</span><span className="text-[11px] text-[#99958e]">{payment.status} · {new Date(payment.updated_at).toLocaleDateString()}</span></span><span className="text-sm font-semibold text-emerald-300">₹{Number(payment.amount).toLocaleString('en-IN')} <ArrowUpRight className="ml-1 inline" size={13} /></span></div>)}</div></>}</DashboardShell>
}

function Metric({ label, value }: { label: string; value: string }) { return <div className={card}><p className="text-[11px] text-[#a09d97]">{label}</p><p className="mt-2 text-2xl font-semibold text-white">{value}</p></div> }
