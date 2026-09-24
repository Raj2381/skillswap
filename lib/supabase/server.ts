import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createMissingSupabaseClient, getSupabaseConfig, warnMissingSupabaseConfig } from '@/lib/env'

export async function createClient() {
  const { url, key, isConfigured } = getSupabaseConfig()

  if (!isConfigured) {
    warnMissingSupabaseConfig()
    return createMissingSupabaseClient()
  }

  const cookieStore = await cookies()

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // ignore cookie writes during build / prerender when no response context is available
        }
      },
    },
  })
}
