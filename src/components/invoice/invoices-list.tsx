'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Eye, Pencil, Printer, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { DeleteInvoiceButton } from '@/components/invoice/delete-invoice-button'
import { formatInvoiceNumber } from '@/lib/utils'

interface Invoice {
  id: string
  invoice_number: number
  invoice_date: string
  client_name: string
  grand_total: number
  paid_amount: number
  due_amount: number
  payment_status: string
  profiles: { username: string } | null
}

interface InvoicesListProps {
  invoices: Invoice[]
}

const ITEMS_PER_PAGE = 25

export function InvoicesList({ invoices }: InvoicesListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [monthFilter, setMonthFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatInvoiceNumber(invoice.invoice_number, invoice.invoice_date)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || invoice.payment_status === statusFilter

      const matchesMonth =
        !monthFilter || invoice.invoice_date.slice(0, 7) === monthFilter

      return matchesSearch && matchesStatus && matchesMonth
    })
  }, [invoices, searchQuery, statusFilter, monthFilter])

  // Pagination calculations
  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex)

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

  // Changing a filter jumps back to page 1
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleMonthChange = (value: string) => {
    setMonthFilter(value)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setMonthFilter('')
    setCurrentPage(1)
  }

  const hasFilters = searchQuery || statusFilter !== 'all' || monthFilter

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by client name or invoice no (e.g., SJMW/01/26-27)..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input
          type="month"
          value={monthFilter}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="w-full sm:w-[170px]"
          aria-label="Filter by month"
        />
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="full">Paid</SelectItem>
            <SelectItem value="advance">Advance</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {startIndex + 1}-{Math.min(endIndex, filteredInvoices.length)} of {filteredInvoices.length} invoices
      </p>

      {paginatedInvoices.length > 0 ? (
        <>
          {/* Table view for both mobile and desktop */}
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Invoice #</TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Client</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Total</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Paid</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Due</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap hidden md:table-cell">Created By</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatInvoiceNumber(invoice.invoice_number, invoice.invoice_date)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(invoice.invoice_date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{invoice.client_name}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      Rs. {invoice.grand_total.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right text-green-600 whitespace-nowrap">
                      Rs. {invoice.paid_amount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right text-destructive whitespace-nowrap">
                      Rs. {invoice.due_amount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.payment_status)}</TableCell>
                    <TableCell className="hidden md:table-cell">{invoice.profiles?.username || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/dashboard/invoices/${invoice.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/invoice/${invoice.id}`} target="_blank">
                            <Printer className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteInvoiceButton invoiceId={invoice.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Previous</span>
                </Button>
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
          <p className="text-muted-foreground">No invoices found matching your search.</p>
          {hasFilters && (
            <Button variant="link" onClick={clearFilters} className="mt-2">
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
