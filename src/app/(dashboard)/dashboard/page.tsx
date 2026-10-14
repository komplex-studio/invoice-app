import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Hash, DollarSign } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [statsResult, hsnResult] = await Promise.all([
    supabase.rpc('get_dashboard_stats').single<{ total_invoices: number; total_revenue: number }>(),
    supabase
      .from('hsn_catalog')
      .select('id', { count: 'exact', head: true })
      .eq('is_deleted', false),
  ])

  let totalInvoices: number
  let totalRevenue: number

  if (statsResult.data) {
    totalInvoices = Number(statsResult.data.total_invoices)
    totalRevenue = Number(statsResult.data.total_revenue)
  } else {
    // Fallback until migration 005 (get_dashboard_stats) is applied
    const invoicesResult = await supabase
      .from('invoices')
      .select('grand_total', { count: 'exact' })
      .eq('is_deleted', false)
    totalInvoices = invoicesResult.count || 0
    totalRevenue =
      invoicesResult.data?.reduce((sum, inv) => sum + (inv.grand_total || 0), 0) || 0
  }

  const totalHsnCodes = hsnResult.count || 0

  const stats = [
    {
      title: 'Total Invoices',
      value: totalInvoices.toString(),
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total HSN Codes',
      value: totalHsnCodes.toString(),
      icon: Hash,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight md:text-2xl">Dashboard</h2>
        <p className="text-sm text-muted-foreground md:text-base">
          Welcome back! Here&apos;s an overview of your business.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
              <CardTitle className="text-xs font-medium md:text-sm">{stat.title}</CardTitle>
              <div className={`rounded-full p-1.5 md:p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-3 w-3 md:h-4 md:w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-lg font-bold md:text-2xl">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
