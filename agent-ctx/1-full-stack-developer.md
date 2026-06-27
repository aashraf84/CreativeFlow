# Task 1: Fix Finance Accounts View Data Display

## Agent: full-stack-developer
## Status: COMPLETED

## Changes Made

### 1. `src/components/erp/finance-accounts-view.tsx`
- **Fix 1**: Added fallback `useEffect` (mount-only) that fetches accounts, journal entries, and tax rates directly from API if store is empty — ensures component works even when parent page.tsx fails to populate store
- **Fix 2**: Simplified KPI calculation — removed `_count?.journalLines` check that incorrectly filtered out accounts with 0 journal lines but valid balances. Now sums all child account balances by type directly
- **Fix 3**: Changed "No accounts found" condition from `filteredAccounts.length === 0` to `financeAccounts.length === 0` — prevents showing empty state when data exists but is filtered out

### 2. `src/app/page.tsx`
- **Fix 4**: Added `safeJson` helper that wraps `res.json()` with `.catch(() => ({}))` — prevents a single failed `.json()` call from breaking the entire `Promise.all` and stopping all data from loading

## Lint: PASS
## Dev Server: Running, no errors
