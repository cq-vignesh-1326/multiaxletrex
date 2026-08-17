# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project: Fleet Analytics Dashboard

**Scope:** Full-stack web application for truck operators in Tamil Nadu to track trips, expenses, and profitability.  
**Tech Stack:** Next.js 14, React 18, TypeScript, MongoDB, Tailwind CSS  
**Deployment:** Vercel + MongoDB Atlas  
**Current Phase:** Phase 0 (Infrastructure) ✅ Complete | **Next:** Phase 1 (Vehicle Management)

---

## Essential Commands

```bash
# Development
npm run dev              # Start dev server on :3000
npm run build           # Build for production
npm start               # Start production server
npm run type-check      # TypeScript type validation
npm run lint            # ESLint check

# Less common but useful
npm audit               # Check for vulnerabilities
npm audit fix           # Auto-fix audit issues
```

**Key Notes:**
- Always run `npm run type-check` before committing (catches TS errors that linting misses)
- The app requires `.env.local` configured (see Environment Variables section)
- MongoDB must be running to start dev server

---

## Architecture Overview

### Full-Stack Data Flow

```
User Browser (React)
    ↓
Next.js App Router Pages (app/*.tsx)
    ↓
API Routes (app/api/*/route.ts) ← Auth middleware checks JWT token
    ↓
Mongoose Models (models/*.ts) → MongoDB
    ↓
Response with NextResponse.json()
```

### Core Layers

**Frontend (Client-Side):**
- Pages use `'use client'` for interactivity
- Fetch data via API routes (same origin)
- Auth state stored in HTTP-only cookies (not localStorage)
- Forms validated with Zod client-side

**Backend (API Routes - Serverless):**
- `lib/middleware.ts`: `withAuth()` wraps handlers to enforce JWT token
- `lib/validators.ts`: Zod schemas validate all POST/PUT bodies
- `lib/auth.ts`: JWT sign/verify, token in cookies
- `lib/encryption.ts`: bcryptjs for passwords, AES-256 for data

**Database:**
- Mongoose schemas in `models/` define collections
- Connection pooling via `lib/db.ts` (reuses connection in dev)
- No migrations tool; schema changes handled manually

---

## Authentication & Authorization

### How Auth Works

1. **Registration** (`POST /api/auth/register`):
   - Body validated with `RegisterSchema` (Zod)
   - Password hashed with bcryptjs (12 rounds) → stored as `encryptedPassword`
   - User document inserted in MongoDB
   - Response includes user object (no token yet)

2. **Login** (`POST /api/auth/login`):
   - Email found, password compared via bcryptjs
   - If valid: JWT signed with `{userId, email, role}` payload
   - Token set in HTTP-only cookie: `authToken` (7d expiry)
   - Refresh token in separate cookie: `refreshToken` (30d expiry)

3. **Protected Routes:**
   - Dashboard pages check `withAuth` middleware
   - Middleware reads `authToken` from cookies
   - `verifyToken()` decodes JWT payload
   - `req.user` contains `{userId, email, role}`
   - Invalid/missing token → 401 Unauthorized

### Key Files
- `lib/auth.ts` — Token generation and verification
- `lib/middleware.ts` — `withAuth()` wrapper for API handlers
- `models/User.ts` — User schema with `encryptedPassword` field
- `models/Company.ts` — Company/organization schema
- `app/api/auth/` — Auth endpoints
- `app/api/admin/companies/` — Company management endpoints
- `app/dashboard/layout.tsx` — Redirects unauthenticated users to login

### Multi-Tenant Architecture

The system supports multiple companies, each with their own users and data:

**User Roles:**
- `superadmin` — Creates companies, manages system-wide settings
- `company_admin` — Manages company, users, and resources
- `truck_admin` — Manages trucks and drivers within company
- `driver` — Operates trucks and records trips

**Data Isolation:**
- Each company has `company_id` field
- Users belong to one company via `company_id`
- API queries must always filter by `company_id` for user data isolation
- Superadmin endpoints (like `/api/admin/companies`) bypass company filtering

**User Creation Flow:**
- ❌ **No self-registration** — Portal login only
- ✅ **Users created by administrators** — Via API endpoints
- **Superadmin Creation:** `POST /api/auth/create-superadmin` with secret header
- **Company Users:** Superadmin/Company Admin add users via `/api/admin/companies/{id}/users`

**Company Workflow:**
1. Superadmin creates company via `POST /api/admin/companies`
2. Superadmin adds company_admin to company
3. Company admin can add truck_admin and drivers to their company
4. Company data (vehicles, trips, expenses) scoped to company

### Adding Protected API Routes

```typescript
// app/api/vehicles/route.ts
import { withAuth } from '@/lib/middleware'

async function handler(req: NextRequest) {
  const user = (req as any).user  // Injected by middleware
  // Your logic here
}

export const GET = withAuth(handler)
export const POST = withAuth(handler)
```

---

## Data Model & Validation

### Core Collections

**Users:**
- `email` (unique), `encryptedPassword` (bcryptjs hash), `full_name`, `phone`
- `role` (superadmin, company_admin, truck_admin, driver)
- `company_id` (ObjectId, references Company) — null for superadmin
- Passwords never returned in API responses
- Legacy fields: `owner_name`, `company_name` (for backward compatibility)

**Companies:**
- `name`, `registration_number` (unique), `industry` (transport/logistics/other)
- `phone`, `email`, `address`, `city`, `state`
- `created_by` (superadmin who created), `company_admin` (ObjectId to User)
- `metadata.total_vehicles`, `metadata.total_users` — counters
- `is_active` (Boolean)

**Vehicles:**
- `owner_id` (foreign key to User), `vehicle_name`, `registration_number` (unique), `vehicle_type`, `capacity_tons`, `fuel_type`
- Queries must filter by `owner_id` for isolation

**Trips:**
- `owner_id`, `vehicle_id`, `source`, `destination`, `trip_date`
- `total_kms`, `load_type`, `load_quantity`, `diesel_consumed`
- `total_income`, `total_expenditure`, `profit_loss` (auto-calculated)
- `milage` auto-calculated as `total_kms / diesel_consumed`
- Mongoose pre-save hook recalculates `milage` and `profit_loss` on update

**Expenses:**
- `trip_id`, `owner_id`, `expense_type` (enum), `amount`, `location`
- Types: `fuel`, `service`, `rto`, `pc`, `loading`, `unloading`, `driver_batta`, `commission`, `toll`, `check_post`, `other`
- Trip's `total_expenditure` is **not** a sum query — client or app logic updates Trip when expenses change

### Input Validation Pattern

All inputs validated with Zod schemas in `lib/validators.ts`:

```typescript
// lib/validators.ts
export const VehicleSchema = z.object({
  vehicle_name: z.string().min(1),
  registration_number: z.string().min(1),
  capacity_tons: z.number().min(1),
  // ...
})

// app/api/vehicles/route.ts
const validation = VehicleSchema.safeParse(body)
if (!validation.success) {
  return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 })
}
```

---

## API Patterns

### Implemented Endpoints

**Auth:**
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login (sets cookies)
- `POST /api/auth/logout` — Logout (clears cookies)
- `GET /api/auth/me` — Get current user (protected)

**Dashboard:**
- `GET /api/dashboard/stats` — Total trips, vehicles, income, expenses, profit (protected)

### Adding New Endpoints

1. Create `app/api/[resource]/route.ts` (list/create) or `app/api/[resource]/[id]/route.ts` (read/update/delete)
2. Wrap handler with `withAuth` if user-scoped
3. Validate input: `const validation = SomeSchema.safeParse(body)`
4. Query MongoDB via Mongoose model
5. Return `NextResponse.json(data, { status: 200 })`

**Template:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { connectToDatabase } from '@/lib/db'
import { SomeSchema } from '@/lib/validators'
import SomeModel from '@/models/SomeModel'

async function handler(req: NextRequest) {
  const validation = SomeSchema.safeParse(await req.json())
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
  }

  await connectToDatabase()
  const user = (req as any).user

  // Your logic
  const result = await SomeModel.create({ ...validation.data, owner_id: user.userId })
  return NextResponse.json(result, { status: 201 })
}

export const POST = withAuth(handler)
```

---

## Frontend Patterns

### Page Structure

Pages in `app/dashboard/[section]/page.tsx` are client components:

```typescript
'use client'

import { useState, useEffect } from 'react'

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/vehicles')
      .then(res => res.json())
      .then(data => { setVehicles(data); setLoading(false) })
  }, [])

  if (loading) return <div>Loading...</div>
  return <div>{/* UI */}</div>
}
```

### Styling

- Tailwind classes used inline; global styles in `app/globals.css`
- Reusable classes defined in globals: `.btn-primary`, `.input-field`, `.card`, `.label`
- Colors in `tailwind.config.ts`; extend theme there if adding custom colors

### Navigation

- Sidebar in `app/dashboard/layout.tsx` links to all dashboard sections
- Auth check redirects unauthenticated users to login

---

## Development Workflow

### Adding a Feature (e.g., Phase 1 — Vehicle Management)

**API First:**
1. Add schema to `lib/validators.ts`
2. Create routes: `app/api/vehicles/route.ts` (GET/POST), `app/api/vehicles/[id]/route.ts` (GET/PUT/DELETE)
3. Test with `curl` or Postman; check `npm run type-check` passes

**Frontend:**
1. Update `app/dashboard/vehicles/page.tsx` to fetch and display data
2. Add form/modal for create/edit
3. Test in browser; check responsive design

**Database:**
1. Schema already defined in `models/Vehicle.ts`; create runs on first insert
2. If schema needs fields, update model and validators together

### Common Tasks

**Connecting to Database:**
```typescript
import { connectToDatabase } from '@/lib/db'
await connectToDatabase()
// Mongoose models are now usable
```

**Querying Models:**
```typescript
import Trip from '@/models/Trip'

// All by owner
const trips = await Trip.find({ owner_id: userId })

// With sorting/filtering
const trips = await Trip.find({ owner_id: userId, status: 'completed' })
  .sort({ trip_date: -1 })
  .limit(10)

// Single document
const trip = await Trip.findById(tripId)
```

**Updating Calculations:**
Trips auto-calculate `milage` and `profit_loss` via Mongoose pre-save hook in the model.

---

## Environment Variables

**.env.local** (required for dev, git-ignored):
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fleet-db
JWT_SECRET=<random 32+ chars>
ENCRYPTION_KEY=<exactly 32 chars>
SUPERADMIN_SECRET=<strong random secret for creating superadmin>
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Important Security Notes:**
- `SUPERADMIN_SECRET` is used as HTTP header (`x-superadmin-secret`) to create first superadmin
- Change these to strong random values in production
- Never commit `.env.local` to git

Generate secure keys:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

**Production (Vercel dashboard):**
- Same as above, but `NEXT_PUBLIC_API_URL=https://yourdomain.vercel.app`

---

## Key Gotchas & Patterns

1. **Cookies & CSRF:** JWT stored in HTTP-only cookies; no localStorage. Vercel/production must use HTTPS for Secure cookie flag.

2. **User Isolation:** All queries must filter by `owner_id` to prevent data leaks. Check this in every API handler.

3. **Auto-Calculations:** Trip's `milage` and `profit_loss` calculated in Mongoose pre-save hook. Manual updates to `total_kms` or `total_expenditure` will trigger recalc.

4. **Expense Total:** Trip's `total_expenditure` is **not** auto-summed from Expense collection. Must be updated manually when expenses change (or add a pre-save hook to sum on read).

5. **No Components Folder Yet:** Reusable React components go in `components/` (not yet created). For now, components are inline in pages.

6. **Error Responses:** Use standard HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Server Error).

7. **Type Safety:** Always use TypeScript for models and API request/response shapes. The project uses `strict: true` in tsconfig.

---

## Development Roadmap

**Phase 0** (✅ Complete): Infrastructure, auth, models, dashboard skeleton  
**Phase 1** (🔄 Next): Vehicle CRUD, list UI, forms  
**Phase 2**: Trip CRUD with inline expense entry, status tracking  
**Phase 3**: Expense categorization and summary  
**Phase 4**: Analytics charts (Recharts), profit trends, efficiency metrics  
**Phase 5**: Advanced features (real-time updates, mobile, offline mode)  
**Phase 6**: Production deployment hardening

Current task checklist in `DEVELOPMENT.md`.

---

## Security Model

- **Passwords:** Hashed with bcryptjs (12 rounds). Never logged or returned in responses.
- **Tokens:** JWT in HTTP-only, Secure, SameSite cookies. 7d access, 30d refresh.
- **Input:** All body/query inputs validated with Zod before use.
- **Database:** Connection pooling; no raw queries.
- **Secrets:** `.env.local` git-ignored; never commit keys.

**TODO:**
- Rate limiting on auth endpoints
- Helmet.js security headers
- CORS origin restrictions
- Audit logging

---

## Testing & Debugging

**Type Errors:**
```bash
npm run type-check
```

**Linting Errors:**
```bash
npm run lint
```

**Runtime Debugging:**
- Next.js dev server shows errors in terminal
- Browser DevTools for client-side issues
- MongoDB Atlas dashboard for query inspection

**Common Issues:**

| Problem | Cause | Fix |
|---------|-------|-----|
| Can't connect to MongoDB | `.env.local` missing/wrong URI | Check `MONGODB_URI`, whitelist IP in Atlas |
| Port 3000 in use | Another app on port | `PORT=3001 npm run dev` |
| JWT not being read | Cookies not set | Check browser DevTools cookies; verify HTTPS in prod |
| `withAuth` returns 401 | Token expired or invalid | Clear cookies, re-login |

---

## Relevant Files by Task

| Task | Files |
|------|-------|
| Add API endpoint | `app/api/.../route.ts`, `lib/validators.ts`, `models/Model.ts` |
| Add dashboard page | `app/dashboard/section/page.tsx`, `app/dashboard/layout.tsx` (for nav) |
| Change auth behavior | `lib/auth.ts`, `app/api/auth/`, `lib/middleware.ts` |
| Update database schema | `models/Model.ts`, `lib/validators.ts`, API handlers |
| Fix styling | `tailwind.config.ts`, `app/globals.css`, component file |

---

**Last Updated:** 2026-08-17  
**Next Phase Checklist:** See `DEVELOPMENT.md` Phase 1
