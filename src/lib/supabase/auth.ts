import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

// getClaims() verifies the JWT locally against the project's cached signing keys,
// avoiding the network round trip getUser() makes to Supabase Auth on every call.
// Middleware has already refreshed the session cookie before this runs.
// Wrapped in cache() so the layout and page share one result per request.
export const getSessionUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data) return null
  return data.claims.sub
})

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const userId = await getSessionUserId()
  if (!userId) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return data
})
