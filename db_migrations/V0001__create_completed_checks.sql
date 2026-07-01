CREATE TABLE t_p66221996_checklist_restaurant.completed_checks (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  zone TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL,
  by_name TEXT NOT NULL,
  restaurant TEXT NOT NULL,
  month TEXT NOT NULL,
  time_str TEXT NOT NULL,
  issues INTEGER NOT NULL DEFAULT 0,
  fine INTEGER,
  ok_count INTEGER,
  total_count INTEGER,
  items_detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);