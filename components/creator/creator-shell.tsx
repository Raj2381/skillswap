'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowUpRight, Bell, BriefcaseBusiness, CircleHelp, ChevronDown, DollarSign, Home, Inbox, Menu, MessageCircle, PlusCircle, Search, Settings, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useNotifications } from '@/lib/data/use-notifications'
import type { User } from '@supabase/supabase-js'

type NavItem = { label: string; href: string; icon: typeof Home; badge?: number }

const primary: NavItem[] = [
  { label: 'Dashboard', href: '/creator/workspace/dashboard', icon: Home },
  { label: 'Requests', href: '/creator/workspace/requests', icon: Inbox },
  { label: 'My Projects', href: '/creator/workspace/projects', icon: BriefcaseBusiness },
  { label: 'Messages', href: '/creator/workspace/messages', icon: MessageCircle },
  { label: 'Post a Gig', href: '/creator/workspace/post-gig', icon: PlusCircle },
  ]
const manage: NavItem[] = [
  { label: 'Profile', href: '/creator/workspace/profile', icon: UserRound },
  { label: 'History & Earnings', href: '/creator/workspace/history', icon: DollarSign },
  { label: 'Settings', href: '/creator/workspace/settings', icon: Settings },
]

export function CreatorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [expanded, setExpanded] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [messagesUnread] = useState(0)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('Creator')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const supabase = createClient()
  const { notifications, unreadCount, markAllRead } = useNotifications(userId)

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(async ({ data }: { data: { user: User | null } }) => {
      if (!data.user || !active) return
      const { data: profile } = await supabase.from('profiles').select('name,avatar_url').eq('id', data.user.id).maybeSingle()
      if (!active) return
      setUserName(profile?.name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Creator')
      setUserAvatar(profile?.avatar_url || null)
    })
    return () => { active = false }
  }, [supabase])

  const creatorInitials = userName.split(/\s+/).map(value => value[0]).join('').slice(0, 2).toUpperCase() || 'C'
  const logout = () => router.push('/creator/workspace/profile')
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) router.replace('/')
  }

  function openNotifications() {
    setNotificationsOpen(true)
    void markAllRead()
  }

  useEffect(() => { supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => setUserId(data.user?.id ?? null)) }, [supabase])

  useEffect(() => {
    const saved = window.localStorage.getItem('skillswap-sidebar-collapsed')
    if (saved !== null) setExpanded(saved !== 'true')
  }, [])

  function toggle() {
    setExpanded((value) => {
      const next = !value
      window.localStorage.setItem('skillswap-sidebar-collapsed', String(!next))
      return next
    })
  }

  const renderItem = (entry: NavItem) => {
    const active = pathname === entry.href || pathname.startsWith(`${entry.href}/`)
    const Icon = entry.icon
    return <button key={entry.href} onClick={() => { setMobileOpen(false); router.push(entry.href) }} title={!expanded ? entry.label : undefined} className={`group flex items-center rounded-xl text-left text-[13px] font-medium transition-all duration-200 ${expanded ? 'w-full justify-between px-3 py-2.5' : 'mx-auto h-11 w-11 justify-center px-0'} ${active ? 'bg-rose-400/12 text-rose-200 shadow-[inset_0_0_0_1px_rgba(190,24,93,0.22)]' : 'text-[#81758f] hover:bg-rose-400/8 hover:text-[#d9d0e8]'}`}><span className={`flex items-center ${expanded ? 'gap-3' : ''}`}><Icon size={18} strokeWidth={1.8} />{expanded && <span className="whitespace-nowrap">{entry.label}</span>}</span>{expanded && ((entry.label === 'Messages' && messagesUnread > 0) || (entry.label !== 'Messages' && entry.badge)) && <span className="rounded-full bg-rose-400/10 px-2 py-0.5 text-[10px] font-bold text-rose-200">{entry.label === 'Messages' ? messagesUnread : entry.badge}</span>}</button>
  }

  return <main className="ambient-canvas min-h-screen bg-[#16080d] text-[#f8f7ff]">
    <div className="ambient-blob ambient-blob-one" aria-hidden="true" />
    <div className="ambient-blob ambient-blob-two" aria-hidden="true" />
    <aside className={`glass-panel fixed inset-y-0 left-0 z-40 flex flex-col border-r border-rose-100/15 bg-[#240d16]/80 px-5 py-6 transition-[width,transform] duration-300 lg:z-20 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${expanded ? 'w-[290px]' : 'w-[92px] px-3'}`}>
      <div className={`flex items-center ${expanded ? 'gap-2' : 'justify-center'}`}><button onClick={toggle} aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"><span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-gradient-to-br from-rose-600 to-rose-500 text-sm font-bold text-white shadow-lg shadow-rose-950/30">S</span></button>{expanded && <Link href="/creator/workspace/dashboard" className="text-[18px] font-bold tracking-[-0.04em] text-[#f8f7ff]">Skill<span className="text-rose-300">Swap</span></Link>}</div>
      <div className={`mt-12 flex flex-1 flex-col ${expanded ? '' : 'items-center'}`}>
        {expanded && <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#81758f]">Workspace</p>}
        <nav className="w-full space-y-1">{primary.map(renderItem)}</nav>
        {expanded && <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#81758f]">Manage</p>}
        <nav className="w-full space-y-1">{manage.map(renderItem)}</nav>
        {expanded && <button onClick={signOut} className="mt-4 w-full rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-[#b8aec9] hover:bg-rose-400/8 hover:text-white">Logout</button>}
        {expanded && <div className="mt-auto rounded-2xl border border-rose-300/10 bg-[#401827] p-5"><div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-rose-400/15 text-rose-200"><CircleHelp size={17} /></div><p className="text-sm font-semibold text-[#f8f7ff]">Need a hand?</p><p className="mt-1 text-xs leading-relaxed text-[#b8aec9]">Our support team is here for you.</p><button className="mt-4 text-xs font-bold text-rose-300">Get help <ArrowUpRight className="ml-1 inline" size={13} /></button></div>}
      </div>
    </aside>
    {mobileOpen && <button className="fixed inset-0 z-30 bg-black/50 lg:hidden" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
    <div className={`relative z-10 transition-[margin] duration-300 ${expanded ? 'lg:ml-[290px]' : 'lg:ml-[92px]'}`}>
      <header className="glass-panel relative z-50 flex h-[74px] items-center justify-between border-b border-rose-100/15 bg-[#240d16]/70 px-5 sm:px-8 lg:px-10"><button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-[#b8aec9] lg:hidden" aria-label="Open menu"><Menu size={20} /></button><div className="relative hidden max-w-[310px] flex-1 sm:block"><Search className="absolute left-3 top-2.5 text-[#81758f]" size={16} /><input className="h-10 w-full rounded-xl border border-rose-300/10 bg-[#32131f] pl-9 pr-3 text-xs text-[#f8f7ff] outline-none placeholder:text-[#81758f] focus:border-rose-400/40" placeholder="Search anything..." /></div><div className="ml-auto flex items-center gap-4"><div className="relative z-[60]"><button onClick={openNotifications} className={`relative rounded-lg p-2 text-[#b8aec9] transition hover:bg-rose-400/10 hover:text-white ${notificationsOpen ? 'bg-rose-400/10 text-white' : ''}`} aria-label="Notifications" aria-expanded={notificationsOpen}><Bell size={19} strokeWidth={1.8} />{unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]" />}</button>{notificationsOpen && <div className="absolute right-0 top-[calc(100%+12px)] z-[70] w-[320px] overflow-hidden rounded-2xl border border-rose-200/15 bg-[#1d0b14]/95 shadow-2xl backdrop-blur-xl"><div className="flex items-center justify-between border-b border-rose-200/10 px-4 py-3"><p className="text-sm font-semibold text-white">Notifications</p><div className="flex items-center gap-3"><button onClick={() => void markAllRead()} disabled={notifications.length === 0} className="text-[11px] text-[#c8b8c5] transition hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40">Clear all</button><button onClick={() => setNotificationsOpen(false)} className="text-[11px] text-[#c8b8c5] hover:text-white">Close</button></div></div><div className="max-h-72 overflow-y-auto">{notifications.length === 0 ? <p className="px-4 py-8 text-center text-xs text-[#9e8490]">You&apos;re all caught up.</p> : notifications.map((notification) => <div key={notification.id} className={`border-b border-rose-200/10 px-4 py-3 transition-colors ${unreadCount > 0 ? 'bg-rose-500/[0.08]' : 'bg-transparent'}`}><div className="flex items-start gap-3"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full transition-opacity duration-300 ${unreadCount > 0 ? 'bg-rose-400 opacity-100' : 'bg-[#6f4b58] opacity-50'}`} /><div className="min-w-0"><p className="text-xs font-semibold text-white">{notification.title}</p><p className="mt-1 text-[11px] leading-5 text-[#c8b8c5]">{notification.message}</p><p className="mt-1 text-[10px] text-[#9e8490]">{new Date(notification.created_at).toLocaleString()}</p></div></div></div>)}</div></div>}</div><div className="hidden h-7 w-px bg-rose-300/10 sm:block" /><Link href="/creator/workspace/profile" className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-rose-400/15 text-[10px] font-bold text-rose-200">{userAvatar ? <img src={userAvatar} alt="" className="h-full w-full object-cover" /> : creatorInitials}</div><span className="hidden text-xs font-semibold text-[#f8f7ff] sm:block">{userName}</span><ChevronDown className="hidden text-[#81758f] sm:block" size={14} /></Link><button onClick={logout} className="hidden text-xs font-semibold text-[#b8aec9] hover:text-white sm:block">Logout</button></div></header>
      <section className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</section>
    </div>
  </main>
}

export function Avatar({ initials, color = 'bg-rose-400/15 text-rose-200' }: { initials: string; color?: string }) { return <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${color}`}>{initials}</div> }
export const card = 'rounded-[20px] border border-rose-300/12 bg-[#32131f] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.16)] sm:p-6'
export const button = 'flex items-center gap-2 rounded-xl bg-gradient-to-br from-rose-600 to-rose-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-950/30 transition hover:-translate-y-0.5 hover:brightness-110'
export const muted = 'text-[#b8aec9]'
export function SectionTitle({ title, subtitle }: { title: React.ReactNode; subtitle: string }) {
  return <div className="hero-region hero-first mb-8"><h1 className="section-title message-heading text-[30px] font-semibold tracking-[-0.04em] text-[#f8f7ff]">{title}</h1><span className="section-title-rule" aria-hidden="true" /><p className={`section-subtitle mt-2 text-sm ${muted}`}>{subtitle}</p></div>
}
export const DashboardShell = CreatorShell
export const BackLink = ({ href, children }: { href: string; children: React.ReactNode }) => <Link className="mb-5 inline-block text-xs font-semibold text-rose-300" href={href}>← {children}</Link>
export const navItems = primary
export const managementItems = manage
