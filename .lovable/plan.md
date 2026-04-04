

## Plan: Fix deletion UX — loading state, optimistic removal, proper refresh

### Problem
When you click Delete, the products don't disappear from the table despite a success toast. Two issues:

1. **No loading indicator** — the delete button doesn't show it's working
2. **Products don't disappear** — the refetch returns the same data, likely because the DELETE silently affects 0 rows (RLS may be blocking deletion of products owned by a different `user_id`)

### Root Cause
The network logs show the authenticated user is `7936a948...` but the products in the database have `user_id: d9a7e6c2...`. Supabase DELETE with RLS returns `204` even when no rows match, so the app thinks deletion succeeded when it actually didn't.

### Changes

**File: `src/components/pricing/VarianceAnalysisDashboard.tsx`**

1. Add a `deleting` state (`useState(false)`) to track when deletion is in progress
2. Show a loading spinner on the Delete button and disable it while `deleting` is true
3. Apply optimistic removal: immediately filter deleted IDs out of the local query cache using `queryClient.setQueryData` before awaiting the server calls
4. On error, roll back the cache to the previous snapshot
5. On completion, invalidate and refetch to sync with the server

**File: `src/hooks/usePricingProducts.tsx`**

6. Add a `user_id` filter (`.eq('user_id', user.id)`) to the delete mutation so it explicitly targets the current user's products — making failures explicit rather than silent

### Technical Detail

```text
handleDeleteSelected flow:
  1. Set deleting = true, disable button, show spinner
  2. Snapshot current query cache
  3. Optimistically remove selected IDs from cache
  4. Fire all DELETE requests (with user_id filter)
  5. On success → toast + clear selection + refetch
  6. On error → restore snapshot + error toast
  7. Set deleting = false
```

The `user_id` filter on the delete call will cause Supabase to return an error if no rows match, making the failure visible rather than silent.

