# User Creation Workflow

## Overview

**No self-registration on the portal.** All users are created by administrators through API endpoints.

This ensures:
- ✅ Security control over who can access the system
- ✅ Automatic company assignment during user creation
- ✅ Role-based access from day one
- ✅ Prevents unauthorized account creation

---

## User Creation Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│              SUPERADMIN CREATION                         │
│  POST /api/auth/create-superadmin (with secret key)     │
│              ↓                                            │
│  Only 1 superadmin needed (created via API)             │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│         COMPANY CREATION (by Superadmin)                 │
│    POST /api/admin/companies                            │
│              ↓                                            │
│    Creates organization (transport company)             │
│    Each company is isolated                             │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│      ADD USERS TO COMPANY (by Superadmin/Company Admin)  │
│  POST /api/admin/companies/{id}/users                   │
│              ↓                                            │
│    Roles: company_admin, truck_admin, driver            │
│    Users automatically scoped to company                │
└─────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Workflow

### Phase 1: Initial Setup (Done Once)

**Who:** System Administrator  
**What:** Create first superadmin  
**How:**
```bash
curl -X POST http://localhost:3000/api/auth/create-superadmin \
  -H "x-superadmin-secret: my_super_secret_key" \
  -d '{
    "email": "superadmin@company.com",
    "password": "SecurePassword",
    "full_name": "System Admin",
    "phone": "9876543210"
  }'
```
**Where:** API call (not portal)  
**Result:** Superadmin account created, can now login to portal

---

### Phase 2: Company Setup (Per Company)

**Who:** Superadmin (logged in to portal via `/login`)  
**What:** Create organization/company  
**How:** API call (or admin panel if built)
```bash
curl -X POST http://localhost:3000/api/admin/companies \
  -H "x-superadmin-secret: my_super_secret_key" \
  -d '{
    "name": "ABC Transport Services",
    "registration_number": "REG-2026-001",
    "industry": "transport"
  }'
```
**When:** Once per company  
**Result:** Company created, get company ID for next step

---

### Phase 3: Add Company Admin (Per Company)

**Who:** Superadmin  
**What:** Create first admin for company  
**How:** API call
```bash
curl -X POST http://localhost:3000/api/admin/companies/{companyId}/users \
  -H "Cookie: authToken=<jwt_token>" \
  -d '{
    "email": "admin@abc.com",
    "password": "AdminPassword",
    "full_name": "Ramesh Kumar",
    "phone": "9876543210",
    "role": "company_admin"
  }'
```
**When:** Once per company  
**Result:** Company admin can now login and manage their company

---

### Phase 4: Add Truck Admin & Drivers (Ongoing)

**Who:** Superadmin OR Company Admin  
**What:** Add operational users  
**How:** API call or (future) admin panel
```bash
# Add truck admin
curl -X POST http://localhost:3000/api/admin/companies/{companyId}/users \
  -H "Cookie: authToken=<jwt_token>" \
  -d '{
    "email": "truckadmin@abc.com",
    "password": "TruckAdminPwd",
    "full_name": "Vikram Singh",
    "phone": "9876543211",
    "role": "truck_admin"
  }'

# Add driver
curl -X POST http://localhost:3000/api/admin/companies/{companyId}/users \
  -d '{
    "email": "driver1@abc.com",
    "password": "DriverPwd",
    "full_name": "Suresh Kumar",
    "phone": "9876543212",
    "role": "driver"
  }'
```
**When:** As needed  
**Result:** Users created with credentials, can login to portal

---

## Portal Pages

### Available Pages

| Page | URL | Who Can Access | What Can Do |
|------|-----|----------------|-----------|
| **Home** | `/` | Everyone | View features, link to login |
| **Login** | `/login` | Everyone | Login with email + password |
| **Dashboard** | `/dashboard` | Authenticated users | See stats, manage fleet |

### Not Available in UI

| Feature | Why | Alternative |
|---------|-----|-------------|
| **Register Page** | ❌ Disabled | Admin creates users via API |
| **Create Superadmin** | ❌ Portal locked | Use API with secret key |
| **Create Company** | ❌ Portal locked | Superadmin uses API |
| **Add Users** | ❌ Portal locked | Superadmin/Admin uses API |

---

## Login Experience

### For New Users

**They Cannot:**
- Register themselves
- Create accounts
- Sign up via portal

**They Must:**
1. Wait for administrator to create their account
2. Receive email with credentials (username/email + password)
3. Go to `/login`
4. Enter credentials
5. Access dashboard

### For Administrators

**Superadmin:**
- Uses secret key to create first account
- Logs in at `/login`
- Can create companies via API
- Can add company admins via API

**Company Admin:**
- Created by superadmin
- Logs in at `/login`
- Can add truck admins and drivers via API
- Manages their company's users and fleet

---

## Key Points

1. **Portal is login-only** — No registration UI
2. **All user creation via API** — Controlled by administrators
3. **First superadmin via secret** — Bootstrapping mechanism
4. **Company admins can create users** — Delegation of responsibility
5. **Users inherit company** — Automatic data scoping
6. **Credentials required** — Email + password authentication

---

## Security Benefits

✅ **No Public Registration** — Prevents random signups  
✅ **Admin Control** — Only approved users get access  
✅ **Automatic Scoping** — Users bound to company from creation  
✅ **Audit Trail** — All user creation is via API (logged)  
✅ **Secret Bootstrap** — First superadmin requires secret key  

---

## Example: Complete User Journey

### Day 1: System Setup
1. Admin calls `POST /api/auth/create-superadmin` (with secret)
2. Superadmin account created
3. Superadmin logs in at `/login`

### Day 2: Company Setup
1. Superadmin calls `POST /api/admin/companies`
2. Company "ABC Transport" created
3. Superadmin adds company admin via API
4. Company admin logs in at `/login`

### Day 3: Team Setup
1. Company admin calls `POST /api/admin/companies/{id}/users`
2. Adds 1 truck admin
3. Adds 5 drivers
4. Each user logs in at `/login` with their credentials

### Day 4+: Operations
- Drivers log in → track trips → record expenses
- Truck admin logs in → manage drivers and trucks
- Company admin logs in → view company analytics
- Superadmin logs in → manage multiple companies

---

## Future Enhancements

- 📱 Admin panel UI for adding users (instead of API calls)
- 📧 Email invitations with auto-generated passwords
- 🔐 Password reset flow
- 👥 Bulk user import (CSV)
- 📊 User activity audit log

---

**Last Updated:** 2026-08-17
