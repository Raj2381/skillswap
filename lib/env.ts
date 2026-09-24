export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ''
  const key = publishableKey || anonKey

  return {
    url,
    key,
    isConfigured: Boolean(url && key),
  }
}

export function getSupabaseMissingMessage() {
  return [
    'Supabase configuration is missing.',
    '',
    'Please create .env.local and add:',
    'NEXT_PUBLIC_SUPABASE_URL=YOUR_REAL_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_REAL_SUPABASE_PUBLISHABLE_KEY',
    '',
    'Optional legacy fallback:',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_REAL_SUPABASE_ANON_KEY',
  ].join('\n')
}

let hasWarnedAboutSupabaseConfig = false

export function warnMissingSupabaseConfig() {
  if (hasWarnedAboutSupabaseConfig || process.env.NODE_ENV === 'test') {
    return
  }

  hasWarnedAboutSupabaseConfig = true
  console.warn(getSupabaseMissingMessage())
}

export function isSupabaseConfigured() {
  return getSupabaseConfig().isConfigured
}

export function createMissingSupabaseClient() {
  const missingMessage = getSupabaseMissingMessage()

  const queryBuilder = {
    select() {
      return this
    },
    eq() {
      return this
    },
    maybeSingle: async () => ({ data: null, error: { message: missingMessage } }),
    update() {
      return {
        eq: async () => ({ data: null, error: { message: missingMessage } }),
      }
    },
    upsert: async () => ({ data: null, error: { message: missingMessage } }),
  }

  const auth = {
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({
      data: { user: null },
      error: { message: missingMessage },
    }),
    signUp: async () => ({
      data: { user: null, session: null },
      error: { message: missingMessage },
    }),
    signOut: async () => ({ error: null }),
    resetPasswordForEmail: async () => ({ data: null, error: { message: missingMessage } }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe() {} } },
      error: null,
    }),
  }

  return {
    auth,
    from: () => queryBuilder,
    rpc: async () => ({ data: null, error: { message: missingMessage } }),
    channel: () => ({
      on() { return this },
      subscribe: () => ({ unsubscribe() {} }),
    }),
    removeChannel: async () => true,
  }
}
