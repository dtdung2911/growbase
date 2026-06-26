-- Description: S4 — get_budget_baselines RPC.
-- Returns all budget_baselines for a household ordered by sort_order.
-- Auth guard via get_user_household_ids().
-- No new tables, no new RLS, no new triggers.

CREATE OR REPLACE FUNCTION get_budget_baselines(p_household_id uuid)
RETURNS TABLE (
  id                        uuid,
  name                      text,
  description               text,
  budget_pct                numeric,
  is_system                 bool,
  is_auto_calculated        bool,
  auto_calculated_source    text,
  linked_category_group_ids uuid[],
  sort_order                int
) AS $$
BEGIN
  IF NOT (p_household_id = ANY(get_user_household_ids())) THEN
    RAISE EXCEPTION 'Access denied: not a member of this household';
  END IF;

  RETURN QUERY
  SELECT bb.id, bb.name, bb.description, bb.budget_pct, bb.is_system,
         bb.is_auto_calculated, bb.auto_calculated_source,
         bb.linked_category_group_ids, bb.sort_order
  FROM budget_baselines bb
  WHERE bb.household_id = p_household_id
  ORDER BY bb.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
