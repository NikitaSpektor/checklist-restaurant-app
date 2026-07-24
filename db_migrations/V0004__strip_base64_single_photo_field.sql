UPDATE t_p66221996_checklist_restaurant.completed_checks c
SET items_detail = sub.new_items
FROM (
  SELECT
    c2.id,
    jsonb_agg(
      CASE
        WHEN (item->>'photo') LIKE 'data:%' THEN
          jsonb_set(item, '{photo}', 'null'::jsonb)
        ELSE item
      END
      ORDER BY ord
    ) AS new_items
  FROM t_p66221996_checklist_restaurant.completed_checks c2,
       jsonb_array_elements(c2.items_detail) WITH ORDINALITY AS arr(item, ord)
  WHERE pg_column_size(c2.items_detail) > 20000
  GROUP BY c2.id
) sub
WHERE c.id = sub.id;