import { redirect } from 'next/navigation'
import { getSessionUserId } from '@/lib/supabase/auth'

export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userId = await getSessionUserId()

  if (!userId) {
    redirect('/login')
  }

  return <>{children}</>
}
