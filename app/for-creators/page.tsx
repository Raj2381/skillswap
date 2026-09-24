import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { ClientNav, card, button } from '@/components/client-shell'

const benefits = ['Showcase your best work', 'Set your own rates and availability', 'Meet ambitious clients', 'Grow your reputation']

export default function ForCreators() {
  return <main className="min-h-screen bg-[#12070B] text-[#FFF5F6]"><ClientNav/><div className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><Link href="/" className="text-sm text-[#D66A84]">← Back to SkillSwap</Link><section className="max-w-3xl py-20"><p className="text-xs font-bold tracking-[.2em] text-[#D66A84]">FOR CREATORS</p><h1 className="mt-5 text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">Your talent deserves a stage.</h1><p className="mt-6 text-lg leading-8 text-[#C7A7B0]">Turn the skills you love into meaningful projects, new connections, and a portfolio you are proud of.</p><Link href="/signup?role=creator" className={`${button} mt-8`}>Create your first gig <ArrowRight className="size-4"/></Link></section><section className="grid gap-4 sm:grid-cols-2">{benefits.map(item => <article key={item} className={`${card} p-6`}><Check className="size-5 text-[#D66A84]"/><h2 className="mt-6 text-lg font-semibold">{item}</h2><p className="mt-2 text-sm leading-6 text-[#9F8189]">Build momentum with a community that values what you do.</p></article>)}</section></div></main>
} 
