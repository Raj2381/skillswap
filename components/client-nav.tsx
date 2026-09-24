'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, ChevronDown, Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/client-shell'
import { button } from '@/components/client-shell'

const clientPaths = ['/creators', '/find-creators', '/projects', '/my-projects', '/chat', '/profile', '/notifications', '/likes', '/booking']

function isClientPath(pathname: string) {
  return clientPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))
}

export function ClientNav() {
  const { profile, loading, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const firstName = profile?.name?.trim().split(/\s+/)[0] || 'Member'
  const initials = profile?.name?.split(/\s+/).map(value => value[0]).join('').slice(0, 2).toUpperCase() || 'M'

  useEffect(() => {
    if (!loading && profile?.role === 'creator' && isClientPath(pathname)) {
      router.replace('/creator/workspace/dashboard')
    }
  }, [loading, pathname, profile?.role, router])

  useEffect(() => {
    if (!profile) return
    let active = true
    const loadUnread = async () => {
      const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).eq('is_read', false)
      if (active) setUnread(count ?? 0)
    }
    void loadUnread()
    const channel = supabase.channel(`client-notifications-${profile.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, () => void loadUnread()).subscribe()
    return () => { active = false; void supabase.removeChannel(channel) }
  }, [profile, supabase])

  useEffect(() => {
    setOpen(false)
    setMoreOpen(false)
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const logout = async () => {
    const { error } = await signOut()
    if (error) return
    setOpen(false)
    setMobileOpen(false)
    router.replace('/')
    router.refresh()
  }

  const links = [
    ['/dashboard', 'Find creators'],
    ['/projects', 'My projects'],
    ['/saved', 'Saved creators'],
    ['/chat', 'Chat'],
    ['/profile', 'Profile'],
    ['/profile/edit', 'Settings'],
  ] as const
  const primaryLinks = links.filter(([href]) => href === '/dashboard' || href === '/projects' || href === '/chat')
  const moreLinks = links.filter(([href]) => href === '/saved' || href === '/profile' || href === '/settings')
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const linkClass = (href: string) => `rounded-lg px-1 py-1 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-[#D66A84] ${isActive(href) ? 'font-medium text-[#E99AAA] underline decoration-[#D66A84] underline-offset-8' : ''}`
  const menuLinkClass = (href: string) => `block rounded-lg px-3 py-2.5 text-sm transition hover:bg-[#3A101C] focus:outline-none focus:ring-2 focus:ring-[#D66A84] ${isActive(href) ? 'bg-[#3A101C] text-[#E99AAA]' : ''}`

  return <header className="sticky top-0 z-30 border-b border-[#3A101C] bg-[#12070B]/95 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
      <Link href="/" className="text-lg font-semibold">Skill<span className="text-[#D66A84]">Swap</span></Link>
      {loading ? <nav aria-label="Client navigation" className="hidden items-center gap-6 lg:flex"><span className="h-4 w-24 animate-pulse rounded bg-[#3A101C]" /><span className="h-4 w-20 animate-pulse rounded bg-[#3A101C]" /><span className="h-4 w-24 animate-pulse rounded bg-[#3A101C]" /></nav> : profile?.role === 'client' ? <><nav aria-label="Client navigation" className="hidden items-center gap-6 text-sm text-[#C7A7B0] lg:flex">{links.map(([href, label]) => <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} className={linkClass(href)}>{label}</Link>)}</nav><nav aria-label="Client navigation" className="hidden items-center gap-6 text-sm text-[#C7A7B0] md:flex lg:hidden">{primaryLinks.map(([href, label]) => <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} className={linkClass(href)}>{label}</Link>)}<div className="relative"><button aria-expanded={moreOpen} aria-haspopup="menu" onClick={() => setMoreOpen(value => !value)} className="inline-flex items-center gap-1 rounded-lg px-2 py-2 transition hover:bg-[#3A101C] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#D66A84]">More<ChevronDown className="size-4" /></button>{moreOpen && <div role="menu" className="absolute right-0 mt-2 w-48 rounded-xl border border-[#54202F] bg-[#250C14] p-2 shadow-xl">{moreLinks.map(([href, label]) => <Link key={href} href={href} role="menuitem" aria-current={isActive(href) ? 'page' : undefined} onClick={() => setMoreOpen(false)} className={menuLinkClass(href)}>{label}</Link>)}</div>}</div></nav></> : <span className="hidden lg:block" />}
      <div className="flex items-center gap-3">
        {loading ? <><span className="hidden h-8 w-20 animate-pulse rounded-lg bg-[#3A101C] sm:block" /><span className="size-8 animate-pulse rounded-full bg-[#3A101C]" /></> : profile ? <>
          <Link href="/notifications" aria-label={unread ? `${unread} unread notifications` : 'Notifications'} className="relative rounded-lg p-1.5"><Bell className="size-5 text-[#D66A84]" />{unread > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-[#A52546] px-1 text-center text-[10px] leading-4 text-white">{unread > 99 ? '99+' : unread}</span>}</Link>
          <div ref={menuRef} className="relative hidden sm:block"><button aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(value => !value)} className="flex items-center gap-2 rounded-xl border border-[#54202F] bg-[#250C14] px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D66A84]"><span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-[#8F1D3B] text-xs font-bold">{profile.avatar_url ? <img src={profile.avatar_url} alt="" className="size-full object-cover" /> : initials}</span><span className="max-w-28 truncate">{firstName}</span><ChevronDown className="size-4 text-[#9F8189]" /></button>{open && <div role="menu" className="absolute right-0 mt-2 w-64 rounded-xl border border-[#54202F] bg-[#250C14] p-2 shadow-xl"><div className="px-3 pb-3"><p className="font-semibold">{profile.name}</p><p className="mt-1 truncate text-xs text-[#9F8189]">{profile.email}</p></div><Link href="/profile" className="block border-t border-[#3A101C] px-3 pt-3 text-sm hover:text-white">Profile</Link><Link href="/settings" className="block px-3 py-2 text-sm hover:text-white">Settings</Link><button onClick={logout} className="w-full border-t border-[#3A101C] px-3 pt-3 text-left text-sm text-[#E7A5B5] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#D66A84]">Logout</button></div>}</div>
          <button className="rounded-lg border border-[#54202F] p-2 sm:hidden" onClick={() => setMobileOpen(value => !value)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>{mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
        </> : <Link href="/login" className={button}>Log in</Link>}
      </div>
    </div>
    {mobileOpen && profile?.role === 'client' && <div className="border-t border-[#3A101C] px-5 py-4 sm:hidden"><nav aria-label="Client mobile navigation" className="grid gap-1 text-sm text-[#C7A7B0]">{links.map(([href, label]) => <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} onClick={() => setMobileOpen(false)} className={menuLinkClass(href)}>{label}</Link>)}<button onClick={logout} className="mt-1 border-t border-[#3A101C] px-3 py-3 text-left text-[#E7A5B5] focus:outline-none focus:ring-2 focus:ring-[#D66A84]">Logout</button></nav></div>}
  </header>
}
