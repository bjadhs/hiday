# Production Audit Report — Hiday

**Date:** 2026-06-15  
**Branch:** `claude/production-audit-vulnerabilities-ep34uk`  
**Stack:** Next.js 16 · React 19 · Supabase · Tailwind v4 · Zustand · TanStack Query

---

## Executive Summary

The codebase is well-structured with proper separation of server actions, validation, and client state. However, **one critical vulnerability was discovered that rendered all route protection inactive**. Several additional high-severity and medium-severity issues were also identified and fixed. All fixes described in this document have been applied to the branch.

---

## CRITICAL Issues (Fixed)

### C-1 — Missing `src/middleware.ts`: All protected routes unguarded

**File:** `src/proxy.ts`  
**Severity:** Critical  
**Status:** Fixed — `src/middleware.ts` created

**Problem:**  
`src/proxy.ts` exports a `proxy` function with route-protection logic (redirect unauthenticated → `/login`, redirect authenticated away from `/login`/`/signup`). However, Next.js only recognizes middleware when it is exported as `middleware` from a file named `middleware.ts` at the project root or `src/`. The file `proxy.ts` with an export named `proxy` is **never executed** by the Next.js runtime.

Result: every route listed as "protected" (`/track`, `/settings`, `/history`, `/analyze`, `/tasks`, `/timeline`, `/todos`, `/kanban`) was accessible without authentication at the page/UI level. Server actions still check auth, so raw data is protected, but unauthenticated users saw the full UI shell with error states instead of being redirected.

**Fix applied:**
```ts
// src/middleware.ts
export { proxy as middleware, config } from './proxy'
```

---

## HIGH Severity Issues (Fixed)

### H-1 — Missing UUID validation in 5 server actions

**Files:** `src/actions/sessions.ts`, `src/actions/planned-sessions.ts`, `src/actions/cached-tasks.ts`  
**Severity:** High  
**Status:** Fixed

**Problem:**  
The following server actions accepted string IDs from the client and passed them directly to Supabase without validating them as UUIDs first. A malformed ID (empty string, SQL-special characters, excessively long string) could cause Supabase to return unexpected error shapes that bubble up to the client, leaking internal error details.

| Function | Missing validation |
|---|---|
| `stopSession(sessionId)` | No `uuid.parse` before DB query |
| `startPlannedSession(sessionId)` | No `uuid.parse` before DB query |
| `deletePlannedSession(sessionId)` | No `uuid.parse` before DB query |
| `unschedulePlannedSession(sessionId)` | No `uuid.parse` before DB query |
| `getCachedTaskById(id)` | No `uuid.parse` before DB query |

Additionally, `getPlannedSessions(date)` and `getPlannedSessionsRange(startDate, endDate)` used unvalidated date strings. An invalid date would produce `NaN` timestamps that silently return wrong query results (no error thrown).

**Fix applied:** Added `uuid.parse(sessionId)` / `dateString.parse(date)` at the top of each function before any DB access. `reorderTasks` also now validates each task ID in the array.

---

### H-2 — `ReactQueryDevtools` always shipped to production

**File:** `src/lib/query-provider.tsx`  
**Severity:** High  
**Status:** Fixed

**Problem:**  
`<ReactQueryDevtools>` was rendered unconditionally, shipping the devtools bundle (~100 KB) to all production users and exposing every query's cache data, request payloads, and error details through a browser UI panel.

**Fix applied:**
```tsx
{process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
```

---

### H-3 — `alert()` in `use-track-page.ts`

**File:** `src/lib/hooks/use-track-page.ts:144`  
**Severity:** High (UX / crash-class)  
**Status:** Fixed

**Problem:**  
`stopSession` catch block called `alert('Failed to stop session. Please try again.')`. Native `alert()` blocks the main thread, cannot be dismissed programmatically, is unstyled, and makes automated testing impossible. In production on mobile it causes a jarring interruption.

**Fix applied:** The catch block now re-throws the error so callers can surface it via React state or toast without blocking the thread.

---

## MEDIUM Severity Issues (Fixed)

### M-1 — No HTTP security headers

**File:** `next.config.ts`  
**Severity:** Medium  
**Status:** Fixed

**Problem:**  
No security headers were configured. Missing headers expose users to clickjacking (`X-Frame-Options`), MIME sniffing (`X-Content-Type-Options`), XSS (`X-XSS-Protection`), and excessive referrer leakage.

**Fix applied:** Added a `headers()` export to `next.config.ts`:
```
X-DNS-Prefetch-Control: on
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**Remaining recommendation:** Add a Content Security Policy (CSP) header. A strict CSP requires careful domain whitelisting for Supabase, fonts, and any CDN. This should be done after the initial launch when all third-party domains are confirmed.

---

### M-2 — Password minimum length only 6 characters

**File:** `src/components/auth-card.tsx`  
**Severity:** Medium  
**Status:** Fixed

**Problem:**  
The signup form enforced a minimum password length of 6 characters. NIST SP 800-63B and OWASP recommend a minimum of 8 characters for user-set passwords.

**Fix applied:** Increased minimum to 8 characters in both the validation check and the `minLength` HTML attribute.

**Remaining recommendation:** Consider adding a password strength indicator and enforcing a maximum length (64–128 chars) to prevent bcrypt DoS through extremely long inputs. Supabase handles hashing server-side, so this is a defense-in-depth concern.

---

### M-3 — `console.log` debug output in production

**File:** `src/components/track/active-timer-card.tsx:289,292`  
**Severity:** Medium  
**Status:** Fixed

**Problem:**  
Two `console.log` statements (logging session IDs and note content) were present in the `handleSaveNoteAndStop` handler. These leak user data into browser DevTools in production.

**Fix applied:** Removed the two statements.

**Remaining / not fixed (low priority):**  
`console.warn` calls for optimistic session guards (e.g., "Cannot save title for optimistic session") are intentional guard rails and acceptable in production as they indicate programming errors, not user data leaks.

---

### M-4 — `maximumScale: 1` blocks pinch-to-zoom (accessibility violation)

**File:** `src/app/layout.tsx`  
**Severity:** Medium (accessibility)  
**Status:** Fixed

**Problem:**  
`maximumScale: 1` in the viewport metadata prevents users from pinching to zoom on mobile. This violates WCAG 2.1 Success Criterion 1.4.4 (Resize Text) and WCAG 1.4.10 (Reflow), and is a real barrier for low-vision users.

**Fix applied:** Removed `maximumScale: 1` from the `Viewport` export.

---

### M-5 — Kanban board not responsive on mobile

**File:** `src/components/kanban/kanban-board.tsx`  
**Severity:** Medium (UX)  
**Status:** Fixed

**Problem:**  
The board used `grid-cols-3` with no responsive breakpoints. On a 375 px phone screen, three columns at ~125 px each are too narrow to read card content, interact with drag handles, or tap buttons reliably.

**Fix applied:**
```
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
```

---

## MEDIUM Severity Issues (Not Fixed — Require Feature Work)

### M-6 — "Revise" Kanban column exists in schema but not rendered

**File:** `src/components/kanban/kanban-board.tsx`  
**Severity:** Medium (data integrity / UX)  
**Status:** Not fixed — requires feature decision

**Problem:**  
`KanbanStatus` includes `'revise'`. `boardKanbanStatusSchema` accepts `'revise'` as a valid drag-drop target. But `COLUMNS` only contains `['next', 'doing', 'done']`. Sessions that end up with `kanban_status = 'revise'` (whether set from the database directly or via a future feature) are **silently invisible** on the board — not shown in any column, not accessible, not deletable from the UI.

**Recommended fix:**  
Either add a Revise column to `COLUMNS`, or remove `'revise'` from `boardKanbanStatusSchema` until the column is implemented:
```ts
const COLUMNS = [
  { id: 'next',   title: 'Next',   color: '#3B82F6' },
  { id: 'doing',  title: 'Doing',  color: '#F59E0B' },
  { id: 'done',   title: 'Done',   color: '#10B981' },
  { id: 'revise', title: 'Revise', color: '#EF4444' },
];
```

---

### M-7 — Security and Data & Privacy settings items are non-functional stubs

**Files:** `src/components/settings/security-section.tsx`, `src/components/settings/data-privacy-section.tsx`  
**Severity:** Medium (UX / trust)  
**Status:** Not fixed — requires feature implementation

**Problem:**  
- "Change Password" renders a static `••••••••` display item with no button, dialog, or action
- "Export Data" is a static `CSV` text item with no download handler
- "Sync Status" always reads "Synced — Last synced: Just now" regardless of actual sync state

Showing controls that appear actionable but do nothing erodes user trust and can confuse users who try to change their password.

**Recommended fix:**  
For Change Password: call `supabase.auth.updateUser({ password })` from a dialog with current + new password fields.  
For Export Data: generate a CSV from session data via a server action and return a download URL.  
For Sync Status: wire to actual `sync_status` field from the DB.

---

### M-8 — No application error boundary

**Severity:** Medium  
**Status:** Not fixed — requires feature implementation

**Problem:**  
No React error boundary exists anywhere in the component tree. If any component throws during render (e.g., a null-dereference on unexpected API data shape), the entire page unmounts and shows a blank white screen with no user feedback or recovery option.

**Recommended fix:**  
Add an error boundary at the root layout and at each page:
```tsx
// src/components/error-boundary.tsx
'use client'
import { Component, ReactNode } from 'react'
export class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }> { ... }
```
Next.js App Router also supports `error.tsx` per-segment for automatic error boundaries.

---

## LOW Severity Issues (Not Fixed)

### L-1 — `setTimeout(2000)` race condition in `startTask`

**File:** `src/lib/hooks/use-track-page.ts:127-130`  
**Severity:** Low  

A 2-second arbitrary timeout is used to prevent the DB-to-store sync from running while a session is being added. On slow connections (>2 s), the flag resets before React Query stabilizes, which can cause momentary duplicate sessions in the UI (they self-resolve on the next sync tick but cause a visible flash).

**Recommended fix:** Instead of a timeout, resolve the flag inside the `onSuccess` callback of the React Query mutation (already exposed via `startSessionMutation`).

---

### L-2 — Landing page uses fabricated social proof statistics

**File:** `src/app/page.tsx:102-122, 345-362`  
**Severity:** Low (legal / trust risk)

The landing page displays "10,000+ Active trackers", "1.2M+ Hours logged", "4.9 Average rating", and an avatar grid implying real users. These appear to be hardcoded placeholder values, not live data.

**Recommended fix:** Either pull real stats from the database, or replace with honest messaging ("Be among the first to track your time with Hiday") during early-stage launch.

---

### L-3 — Show/hide password toggle reveals both password fields

**File:** `src/components/auth-card.tsx`  
**Severity:** Low (UX)

A single `showPassword` state toggle controls both the password and confirm-password input types. If a user wants to verify only one field, they must toggle and re-toggle, exposing the other.

**Recommended fix:** Give each password field its own `showConfirmPassword` boolean state.

---

### L-4 — No "Forgot Password" flow

**File:** `src/components/auth-card.tsx`  
**Severity:** Low (UX)

The login page has no "Forgot password?" link. Supabase provides `supabase.auth.resetPasswordForEmail()`.

---

### L-5 — Supabase error messages shown verbatim to end users

**File:** `src/components/auth-card.tsx:76, 96`  
**Severity:** Low (UX / minor info disclosure)

`error.message` from Supabase is displayed directly. Supabase messages are generally user-friendly, but they can expose internal details (e.g., "User already registered" lets attackers enumerate registered emails). Consider mapping known error codes to generic messages.

---

### L-6 — Missing `aria-label` on password show/hide toggle button

**File:** `src/components/auth-card.tsx:217`  
**Severity:** Low (accessibility)

The eye/eye-off button has no `aria-label`, so screen readers announce it only as "button". Add `aria-label={showPassword ? 'Hide password' : 'Show password'}`.

---

## Architecture Observations (No Code Change Required)

### A-1 — Dual state management for active sessions (Zustand + React Query)

Active sessions are managed simultaneously in a Zustand store AND via React Query. The `syncFromDatabase` function merges DB state into the store, which is complex and has subtle ordering dependencies. This works correctly today, but future changes must carefully consider which layer is authoritative.

**Recommendation:** Long-term, consider making React Query the single source of truth and deriving UI-specific state (elapsed times, editing state) via selectors rather than a parallel Zustand store.

---

### A-2 — "Cached" server actions don't use `cache()` or `unstable_cache`

**Files:** `src/actions/cached-sessions.ts`, `src/actions/cached-tasks.ts`

Functions named `getCached*` are plain server actions with no Next.js cache directive. The `revalidateTasksCache()` function is a no-op. Caching is entirely handled client-side by React Query's `staleTime`. The naming is misleading — future developers may assume Next.js-level caching is happening.

**Recommendation:** Either rename to `get*` (removing the "cached" prefix) or implement actual `cache()` wrapping if per-request deduplication is needed.

---

### A-3 — `updatePlannedSession` makes 2 DB round-trips when updating duration without start time

**File:** `src/actions/planned-sessions.ts:163`

When `plannedDuration` is set but `plannedStartTime` is undefined, a second query is issued via `getPlannedSessionById` to fetch the current `started_at` for recalculating `ended_at`. This doubles DB latency on a common operation.

**Recommendation:** Require callers to pass the current `started_at` when patching duration, or use a Postgres `UPDATE ... RETURNING started_at + interval` approach to keep it single-round-trip.

---

## UI/UX Summary

| Area | Status |
|---|---|
| Dark / light theme | Good — `next-themes`, system default |
| Mobile layout | Fixed (Kanban), still limited for Timeline and Track views on small screens |
| Accessibility | Improved (removed `maximumScale`); missing aria-label on password toggle |
| Loading states | Good — per-button loading indicators, `useTransition`, optimistic UI |
| Error states | Partially fixed (`alert()` removed); no error boundary, no toast system |
| Typography | Consistent Geist font, font-size preference persisted via Zustand |

---

## Summary of Applied Fixes

| ID | Description | Files Changed |
|---|---|---|
| C-1 | Created `src/middleware.ts` to activate route protection | `src/middleware.ts` (new) |
| H-1 | UUID validation in `stopSession`, `startPlannedSession`, `deletePlannedSession`, `unschedulePlannedSession`, `getCachedTaskById`, `reorderTasks`; date validation in `getPlannedSessions` and `getPlannedSessionsRange` | `src/actions/sessions.ts`, `src/actions/planned-sessions.ts`, `src/actions/cached-tasks.ts`, `src/actions/tasks.ts` |
| H-2 | `ReactQueryDevtools` dev-only | `src/lib/query-provider.tsx` |
| H-3 | Replace `alert()` with re-throw | `src/lib/hooks/use-track-page.ts` |
| M-1 | HTTP security headers | `next.config.ts` |
| M-2 | Password minimum 6 → 8 | `src/components/auth-card.tsx` |
| M-3 | Remove debug `console.log` | `src/components/track/active-timer-card.tsx` |
| M-4 | Remove `maximumScale: 1` | `src/app/layout.tsx` |
| M-5 | Kanban responsive grid | `src/components/kanban/kanban-board.tsx` |
