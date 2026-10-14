import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Indian financial year runs from April 1 to March 31.
export function getFinancialYear(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = d.getMonth() // 0-indexed; 3 = April
  const fyStart = month >= 3 ? year : year - 1
  const fyEnd = fyStart + 1
  return { fyStart, fyEnd }
}

// Returns "YYYY-04-01" and "YYYY-03-31" (next year) as ISO date strings
// for the FY containing the given date.
export function getFinancialYearRange(date: Date | string) {
  const { fyStart, fyEnd } = getFinancialYear(date)
  return {
    start: `${fyStart}-04-01`,
    end: `${fyEnd}-03-31`,
  }
}

// Format: SJMW/01/26-27
export function formatInvoiceNumber(invoiceNumber: number, invoiceDate: Date | string) {
  const { fyStart, fyEnd } = getFinancialYear(invoiceDate)
  const num = String(invoiceNumber).padStart(2, '0')
  const fy = `${String(fyStart).slice(-2)}-${String(fyEnd).slice(-2)}`
  return `SJMW/${num}/${fy}`
}

// Heading for sale reports, e.g. "SALE FOR THE MONTH OF NOVEMBER-2024" when the
// range covers exactly one calendar month, otherwise "SALE FROM dd/MM/yyyy TO dd/MM/yyyy".
export function getSaleReportTitle(startDate: string, endDate: string) {
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)
  const lastDayOfMonth = new Date(sy, sm, 0).getDate()
  if (sy === ey && sm === em && sd === 1 && ed === lastDayOfMonth) {
    const month = new Date(sy, sm - 1, 1).toLocaleString('en-US', { month: 'long' }).toUpperCase()
    return `SALE FOR THE MONTH OF ${month}-${sy}`
  }
  const fmt = (y: number, m: number, d: number) =>
    `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
  return `SALE FROM ${fmt(sy, sm, sd)} TO ${fmt(ey, em, ed)}`
}
