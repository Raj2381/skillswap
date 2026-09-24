import { createBrowserClient } from '@supabase/ssr'
import { createMissingSupabaseClient, getSupabaseConfig, warnMissingSupabaseConfig } from '@/lib/env'

let client: any

export function createClient() {
  if (client) return client

  const { url, key, isConfigured } = getSupabaseConfig()

  if (!isConfigured) {
    warnMissingSupabaseConfig()
    client = createMissingSupabaseClient()
    return client
  }

  client = createBrowserClient(url, key)
  return client
}
