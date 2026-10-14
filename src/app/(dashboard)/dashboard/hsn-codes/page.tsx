import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Pencil } from 'lucide-react'
import { DeleteButton } from '@/components/common/delete-button'
import { deleteHsnEntry } from '@/actions/hsn-catalog'

export default async function HsnCodesPage() {
  const supabase = await createClient()

  const profile = await getCurrentProfile()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: entries } = await supabase
    .from('hsn_catalog')
    .select('*')
    .eq('is_deleted', false)
    .order('hsn_code')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">HSN Codes</h2>
          <p className="text-muted-foreground">
            HSN code, product and pricing reference used to auto-fill invoice line items.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/hsn-codes/new">
            <Plus className="mr-2 h-4 w-4" /> Add HSN
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All HSN Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {entries && entries.length > 0 ? (
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>HSN Code</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.hsn_code}</TableCell>
                      <TableCell>{entry.product_name}</TableCell>
                      <TableCell className="text-right">
                        Rs. {Number(entry.rate).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>{entry.unit}</TableCell>
                      <TableCell>
                        {entry.is_active ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/dashboard/hsn-codes/${entry.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DeleteButton
                            id={entry.id}
                            action={deleteHsnEntry}
                            itemName="HSN entry"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No HSN entries found.</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/hsn-codes/new">
                  <Plus className="mr-2 h-4 w-4" /> Add your first HSN entry
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
