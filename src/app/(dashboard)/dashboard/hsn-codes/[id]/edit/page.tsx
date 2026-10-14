import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/auth'
import { HsnCatalogForm } from '@/components/forms/hsn-catalog-form'

export default async function EditHsnEntryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const profile = await getCurrentProfile()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: entry } = await supabase
    .from('hsn_catalog')
    .select('*')
    .eq('id', id)
    .single()

  if (!entry) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit HSN Entry</h2>
        <p className="text-muted-foreground">Update the HSN code, product name, or rate.</p>
      </div>

      <HsnCatalogForm
        initialData={{
          id: entry.id,
          hsn_code: entry.hsn_code,
          product_name: entry.product_name,
          rate: Number(entry.rate),
          unit: entry.unit,
          is_active: entry.is_active,
        }}
      />
    </div>
  )
}
