import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/supabase/auth'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Toaster } from '@/components/ui/sonner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect('/login')
  }

  return (
    <>
      <DashboardShell user={{ username: profile.username, email: profile.email, role: profile.role }}>
        {children}
      </DashboardShell>
      <Toaster />
    </>
  )
}
