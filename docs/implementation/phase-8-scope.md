# Phase 8 — Import Center & Data Quality

Import preview now validates required reference, numeric non-negative amount, duplicate references within a batch, and project ownership. Invalid rows are returned with row number and message; valid rows are normalized to cents and are safe to preview before persistence. File parsing, mapping UI, batch persistence, rollback, and XLSX adapters remain integration work.
