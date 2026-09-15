ALTER TABLE t_p66221996_checklist_restaurant.completed_checks
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'checklist',
  ADD COLUMN IF NOT EXISTS seating_percent integer NULL,
  ADD COLUMN IF NOT EXISTS check_date date NULL;
