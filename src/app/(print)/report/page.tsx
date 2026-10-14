import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCompanySettings } from '@/actions/settings'
import { SaleReportPrintView } from '@/components/report/sale-report-print-view'
import { getSaleReportTitle } from '@/lib/utils'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

type SearchParams = Promise<{ start?: string; end?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { start, end } = await searchParams
  if (!start || !end || !ISO_DATE.test(start) || !ISO_DATE.test(end)) return { title: 'Sale Report' }
  // The tab title becomes the default filename when saving as PDF
  return { title: `SJMW ${getSaleReportTitle(start, end)}` }
}

export default async function PrintSaleReportPage({ searchParams }: { searchParams: SearchParams }) {
  const { start, end } = await searchParams
  if (!start || !end || !ISO_DATE.test(start) || !ISO_DATE.test(end)) {
    notFound()
  }

  const supabase = await createClient()

  const [invoiceResult, companySettings] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, invoice_number, invoice_date, client_name, gstin, sub_total, discount, cgst_amount, sgst_amount, grand_total')
      .eq('is_deleted', false)
      .gte('invoice_date', start)
      .lte('invoice_date', end)
      .order('invoice_date', { ascending: true })
      .order('invoice_number', { ascending: true }),
    getCompanySettings(),
  ])

  return (
    <SaleReportPrintView
      companyName={companySettings.company_name}
      startDate={start}
      endDate={end}
      invoices={invoiceResult.data || []}
    />
  )
}
