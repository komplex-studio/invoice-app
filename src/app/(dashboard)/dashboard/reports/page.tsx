'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { endOfMonth, format, parseISO, startOfMonth, subMonths } from 'date-fns'
import { formatInvoiceNumber } from '@/lib/utils'

interface Invoice {
  id: string
  invoice_number: number
  invoice_date: string
  client_name: string
  gstin: string | null
  sub_total: number
  discount: number | null
  cgst_amount: number
  sgst_amount: number
  grand_total: number
  paid_amount: number
  due_amount: number
  payment_status: string
}

const formatAmount = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function ReportsPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const supabase = createClient()

  const runReport = async (start: string, end: string) => {
    if (!start || !end) return

    setIsLoading(true)
    setHasSearched(true)

    const { data } = await supabase
      .from('invoices')
      .select('id, invoice_number, invoice_date, client_name, gstin, sub_total, discount, cgst_amount, sgst_amount, grand_total, paid_amount, due_amount, payment_status')
      .eq('is_deleted', false)
      .gte('invoice_date', start)
      .lte('invoice_date', end)
      .order('invoice_date', { ascending: true })
      .order('invoice_number', { ascending: true })

    setInvoices(data || [])
    setIsLoading(false)
  }

  const handleSearch = () => runReport(startDate, endDate)

  const selectMonth = (monthsAgo: number) => {
    const month = subMonths(new Date(), monthsAgo)
    const start = format(startOfMonth(month), 'yyyy-MM-dd')
    const end = format(endOfMonth(month), 'yyyy-MM-dd')
    setStartDate(start)
    setEndDate(end)
    runReport(start, end)
  }

  const handleDownloadPdf = () => {
    window.open(`/report?start=${startDate}&end=${endDate}`, '_blank')
  }

  const totals = invoices.reduce(
    (acc, inv) => ({
      sale: acc.sale + inv.sub_total - (inv.discount || 0),
      cgst: acc.cgst + inv.cgst_amount,
      sgst: acc.sgst + inv.sgst_amount,
      total: acc.total + inv.grand_total,
      paid: acc.paid + inv.paid_amount,
      due: acc.due + inv.due_amount,
    }),
    { sale: 0, cgst: 0, sgst: 0, total: 0, paid: 0, due: 0 }
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'full':
        return <Badge className="bg-green-500">Paid</Badge>
      case 'advance':
        return <Badge className="bg-yellow-500">Advance</Badge>
      default:
        return <Badge variant="destructive">Unpaid</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground">Generate date-wise sale reports and download them as PDF.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Range Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={handleSearch} disabled={!startDate || !endDate || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Report
            </Button>
            <Button variant="outline" onClick={() => selectMonth(0)} disabled={isLoading}>
              This Month
            </Button>
            <Button variant="outline" onClick={() => selectMonth(1)} disabled={isLoading}>
              Last Month
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasSearched && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Rs. {totals.total.toLocaleString('en-IN')}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Collected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  Rs. {totals.paid.toLocaleString('en-IN')}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Outstanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  Rs. {totals.due.toLocaleString('en-IN')}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Sale Report ({format(parseISO(startDate), 'dd/MM/yyyy')} - {format(parseISO(endDate), 'dd/MM/yyyy')})
                </CardTitle>
                <Button onClick={handleDownloadPdf} disabled={invoices.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Bill No</TableHead>
                      <TableHead>Party Name</TableHead>
                      <TableHead>GST No</TableHead>
                      <TableHead className="text-right">Sale 18%</TableHead>
                      <TableHead className="text-right">CGST 9%</TableHead>
                      <TableHead className="text-right">SGST 9%</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice, index) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          {format(parseISO(invoice.invoice_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatInvoiceNumber(invoice.invoice_number, invoice.invoice_date)}
                        </TableCell>
                        <TableCell>{invoice.client_name}</TableCell>
                        <TableCell>{invoice.gstin || '-'}</TableCell>
                        <TableCell className="text-right">
                          {formatAmount(invoice.sub_total - (invoice.discount || 0))}
                        </TableCell>
                        <TableCell className="text-right">{formatAmount(invoice.cgst_amount)}</TableCell>
                        <TableCell className="text-right">{formatAmount(invoice.sgst_amount)}</TableCell>
                        <TableCell className="text-right font-medium">
                          Rs. {invoice.grand_total.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          Rs. {invoice.paid_amount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          Rs. {invoice.due_amount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.payment_status)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold hover:bg-muted/50">
                      <TableCell colSpan={5} className="text-right">TOTAL</TableCell>
                      <TableCell className="text-right">{formatAmount(totals.sale)}</TableCell>
                      <TableCell className="text-right">{formatAmount(totals.cgst)}</TableCell>
                      <TableCell className="text-right">{formatAmount(totals.sgst)}</TableCell>
                      <TableCell className="text-right">Rs. {totals.total.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right text-green-600">Rs. {totals.paid.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right text-destructive">Rs. {totals.due.toLocaleString('en-IN')}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">No invoices found for the selected date range.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
