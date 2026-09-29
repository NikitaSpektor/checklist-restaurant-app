ALTER TABLE t_p66221996_checklist_restaurant.completed_checks
  ADD COLUMN IF NOT EXISTS participants text NULL,
  ADD COLUMN IF NOT EXISTS receipt_photos jsonb NULL;