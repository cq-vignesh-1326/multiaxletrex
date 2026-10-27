# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project: Convoy Fleet Desk

Accounts book for a Tamil Nadu transport office, ported from a single-file "Convoy Fleet Desk" artifact.
Every label is bilingual (English + Tamil). **Stack:** Next.js 14 (App Router), React 18, TypeScript (strict),
MongoDB via Mongoose, Zod. Plain CSS in `app/globals.css` (no Tailwind). PDF via `jspdf` + `html2canvas`.

## Commands

```bash
npm run dev          # :3000
npm run build
npm run type-check   # run before committing
npm run lint
```

`.env.local` needs `MONGODB_URI`, `JWT_SECRET`, `SUPERADMIN_SECRET` (see `.env.example`).

## Architecture

- **Client-held book.** `components/convoy/BookProvider.tsx` loads the whole book for the user's company
  (`GET /api/book`) into a ref, exposes `mutate(fn)` to change it in place, and debounces changed/removed
  documents to `POST /api/book/sync` (diffs each doc's stable JSON against what was last saved). It reloads
  on window focus when nothing is pending. Pages read `useBook().book` and re-render on `version`.
- **Four collections** (`models/book.ts`): `sheets`, `people`, `vehicles`, `ledger`. Each doc is keyed by
  `(company_id, doc_id)`; `doc_id` is the client-generated id. Sync replaces whole documents (last write wins).
- **Validation** (`lib/validators.ts`): numeric fields arrive as typed text and are normalised to `number | null`;
  the client tolerates both (`num()` in `lib/convoy/format.ts`).
- **Domain logic** lives in `lib/convoy/` and is pure: `calc.ts` (sheet totals, driver settlement, report groups,
  sheet numbering `<last 4 digits of reg>_<nnn>`), `migrate.ts` (imports old artifact backups, sample data),
  `pdf.ts`, `constants.ts` (expense heads, payment modes).
- **Auth:** JWT in the http-only `authToken` cookie (`lib/auth.ts`). `withAuth(handler, { ownerOnly })` in
  `lib/middleware.ts` passes the token payload `{ userId, email, role, companyId }`. Roles: `owner`, `staff`.
  `POST /api/auth/setup` (header `x-superadmin-secret`) creates a company and its owner.
- **Every book query filters by `company_id`** from the token — never from the request body.

## Key rules from the paper process

- Commission and driver bata are a % of rent (defaults 5% and 10%, per sheet).
- Rent payments are recorded per load; cash the driver collects (`mode: 'driver'`) counts toward his advance.
- Driver settlement = what the driver paid from trip cash − (advances + rent he collected). Positive → pay driver.
- Expense lines have `by: 'driver' | 'office'`; only driver-paid lines enter the driver account.

## Layout

| Path | What |
|------|------|
| `app/dashboard/page.tsx` | Overview |
| `app/dashboard/sheets/` | Sheet list and `[id]` editor (`components/convoy/SheetEditor.tsx`) |
| `app/dashboard/reports/page.tsx` | Group/sort/compare by vehicle, driver, month |
| `app/dashboard/masters/page.tsx` | Drivers, cleaners, vehicles, office logins |
| `components/convoy/` | Provider, shell, inputs (date picker, suggestions), drawers |
