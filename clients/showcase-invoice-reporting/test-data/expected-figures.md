# Expected figures for the base data (independent calculation)

Test date (run date) assumed: **2026-11-02 (Monday)**. W1 report week: 2026-10-26 to 2026-11-01; prior week 2026-10-19 to 2026-10-25. The dates in the files are frozen for this run date. If you test on another day, shift every date in the files by the same number of days (see README) or re-derive the tiers by hand.

Calculated with plain date arithmetic in a separate script, not with the workflow logic. Amounts in major units.

| Currency | Sales this week | Lines | Sales prior week | Lines | Open balance | Open invoices | Not due | 1-7 | 8-30 | 31+ | Overdue balance | Overdue count | Overdue no usable email |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| USD | 8509.00 | 23 | 7791.00 | 21 | 16595.50 | 18 | 2490.00 | 3100.50 | 6405.00 | 4600.00 | 14105.50 | 15 | 2 |
| EUR | 2490.00 | 7 | 0.00 | 0 | 2730.00 | 4 | 450.00 | 540.00 | 980.00 | 760.00 | 2280.00 | 3 | 1 |

## Top customers this week (per currency, sales in the report week)

**USD**: 1. Sample Customer D 1620.00; 2. Sample Customer F 1515.00; 3. Sample Customer C 1458.00; 4. Sample Customer E 1401.00; 5. Sample Customer B 1122.00

**EUR**: 1. Sample Customer F 898.00; 2. Sample Customer B 425.00; 3. Sample Customer A 384.00; 4. Sample Customer E 302.00; 5. Sample Customer D 261.00

## Reminder levels on 2026-11-02 (open invoices, W2)

| invoice_no | Days past due | Level | Notes |
|---|---|---|---|
| INV-1001 | 0 | not overdue |  |
| INV-1002 | 1 | t1 |  |
| INV-1003 | 7 | t1 |  |
| INV-1004 | 8 | t2 |  |
| INV-1005 | 30 | t2 |  |
| INV-1006 | 31 | t3 |  |
| INV-1007 | 45 | t3 |  |
| INV-1008 | 12 | t2 |  |
| INV-1009 | 3 | t1 |  |
| INV-1010 | 10 | t2 |  |
| INV-1011 | 5 | t1 |  |
| INV-1012 | 9 | t2 |  |
| INV-1013 | 4 | t1 | no usable email: logged skipped_no_email, no approval |
| INV-1014 | 15 | t2 | no usable email: logged skipped_no_email, no approval |
| INV-1015 | 6 | t1 |  |
| INV-1016 | 20 | t2 |  |
| INV-1017 | -8 | not overdue |  |
| INV-1018 | -20 | not overdue |  |
| INV-1101 | 12 | t2 |  |
| INV-1102 | -10 | not overdue |  |
| INV-1104 | 33 | t3 | no usable email: logged skipped_no_email, no approval |
| INV-1105 | 2 | t1 |  |

With the default cap of 10 per run, the first 10 eligible invoices are claimed and the rest wait for the next day (T28 uses a cap of 2).
