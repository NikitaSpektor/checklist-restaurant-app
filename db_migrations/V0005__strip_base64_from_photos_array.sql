UPDATE t_p66221996_checklist_restaurant.completed_checks c
SET items_detail = sub.new_items
FROM (
  SELECT
    c2.id,
    jsonb_agg(
      CASE
        WHEN item ? 'photos' AND jsonb_typeof(item->'photos') = 'array' THEN
          jsonb_set(
            item,
            '{photos}',
            COALESCE(
              (
                SELECT jsonb_agg(p)
                FROM jsonb_array_elements_text(item->'photos') AS p
                WHERE p NOT LIKE 'data:%'
              ),
              '[]'::jsonb
            )
          )
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