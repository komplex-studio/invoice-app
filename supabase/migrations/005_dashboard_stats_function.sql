-- Aggregate dashboard stats in the database instead of sending every invoice
-- row to the app just to add up grand_total.
-- SECURITY INVOKER (the default) keeps RLS in effect, so non-admin users only
-- count the invoices they are allowed to see.
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE (total_invoices BIGINT, total_revenue NUMERIC)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT COUNT(*), COALESCE(SUM(grand_total), 0)
    FROM public.invoices
    WHERE is_deleted = false;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;
