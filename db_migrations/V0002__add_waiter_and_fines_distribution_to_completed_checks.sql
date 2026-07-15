ALTER TABLE t_p66221996_checklist_restaurant.completed_checks
  ADD COLUMN IF NOT EXISTS waiter_name TEXT,
  ADD COLUMN IF NOT EXISTS fines_distribution TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();