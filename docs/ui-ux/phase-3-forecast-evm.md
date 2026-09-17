# Phase 3 UI — Forecast & EVM

## Forecast workspace

Period stepper, prior forecast comparison, editable ETC grid by WBS/cost code, actual-to-date column, EAC/VAC summary, assumptions/evidence drawer, and submit/review/approve/lock timeline. Locked periods are visibly read-only.

## EVM workspace

KPI cards for BAC, PV, EV, AC, CV, SV, CPI, SPI, and TCPI. Main S-Curve compares PV/EV/AC. Performance table drills Project → WBS → Control Account and preserves historical period snapshots.

## Guardrails

All forecast edits require period and project scope; approval actions remain human-only. CPI/SPI with zero denominator display `N/A`, not zero.
