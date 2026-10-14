'use client'

import { format, parseISO } from 'date-fns'
import { formatInvoiceNumber, getSaleReportTitle } from '@/lib/utils'

export interface SaleReportInvoice {
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
}

interface SaleReportPrintViewProps {
  companyName: string
  startDate: string
  endDate: string
  invoices: SaleReportInvoice[]
}

export function getTaxableAmount(invoice: SaleReportInvoice) {
  return invoice.sub_total - (invoice.discount || 0)
}

const money = (n: number) => n.toFixed(2)

export function SaleReportPrintView({ companyName, startDate, endDate, invoices }: SaleReportPrintViewProps) {
  const totals = invoices.reduce(
    (acc, inv) => ({
      sale: acc.sale + getTaxableAmount(inv),
      cgst: acc.cgst + inv.cgst_amount,
      sgst: acc.sgst + inv.sgst_amount,
      total: acc.total + inv.grand_total,
    }),
    { sale: 0, cgst: 0, sgst: 0, total: 0 }
  )

  const cell = 'border border-black px-2 py-2 text-center'

  return (
    <div className="bg-white min-h-screen overflow-auto text-black">
      <style jsx global>{`
        html, body {
          overflow: auto !important;
          height: auto !important;
        }
        @media print {
          html, body {
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            overflow: visible !important;
            height: auto !important;
          }
          .no-print { display: none !important; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
        }
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
      `}</style>

      <div className="no-print p-4 bg-gray-100 sticky top-0 z-10 flex items-center gap-3">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
        >
          Download / Print PDF
        </button>
        <span className="text-sm text-gray-600">
          In the print dialog, choose &quot;Save as PDF&quot; to download.
        </span>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 text-[12px] font-sans">
        <table className="w-full border-collapse border-2 border-black">
          <thead>
            <tr>
              <th colSpan={9} className="border-2 border-black py-1 text-2xl font-normal uppercase">
                {companyName}
              </th>
            </tr>
            <tr>
              <th colSpan={9} className="border-2 border-black py-1 text-lg font-normal">
                {getSaleReportTitle(startDate, endDate)}
              </th>
            </tr>
            <tr className="font-bold">
              <th className={cell}>S.NO</th>
              <th className={cell}>DATE</th>
              <th className={cell}>BILL NO</th>
              <th className={cell}>PARTY NAME</th>
              <th className={cell}>GST NO</th>
              <th className={cell}>SALE 18%</th>
              <th className={cell}>CGST 9%</th>
              <th className={cell}>SGST 9%</th>
              <th className={cell}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => (
              <tr key={inv.id}>
                <td className={`${cell} font-bold`}>{i + 1}</td>
                <td className={cell}>{format(parseISO(inv.invoice_date), 'dd/MM/yyyy')}</td>
                <td className={cell}>{formatInvoiceNumber(inv.invoice_number, inv.invoice_date)}</td>
                <td className={cell}>{inv.client_name}</td>
                <td className={cell}>{inv.gstin || ''}</td>
                <td className={cell}>{money(getTaxableAmount(inv))}</td>
                <td className={cell}>{money(inv.cgst_amount)}</td>
                <td className={cell}>{money(inv.sgst_amount)}</td>
                <td className={cell}>{money(inv.grand_total)}</td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={9} className={`${cell} py-6 text-gray-500`}>
                  No invoices found for this period.
                </td>
              </tr>
            )}
            <tr className="font-bold bg-gray-100 border-t-2 border-black">
              <td colSpan={5} className={`${cell} border-t-2 text-right pr-4 tracking-wider`}>
                TOTAL ({invoices.length} {invoices.length === 1 ? 'BILL' : 'BILLS'})
              </td>
              <td className={`${cell} border-t-2`}>{money(totals.sale)}</td>
              <td className={`${cell} border-t-2`}>{money(totals.cgst)}</td>
              <td className={`${cell} border-t-2`}>{money(totals.sgst)}</td>
              <td className={`${cell} border-t-2 text-[13px]`}>{money(totals.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
