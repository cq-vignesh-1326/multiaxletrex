# Role-Based Access Control (RBAC)

## System Architecture

The dashboard implements 4-tier role-based access control with data isolation at each level.

```
┌─────────────────────────────────────────────────────────┐
│                    SUPERADMIN                            │
│         (Full System Access - All Companies)             │
├─────────────────────────────────────────────────────────┤
│  • Manage companies                                      │
│  • View/manage users across all companies               │
│  • View/manage trucks across all companies              │
│  • View/manage trips & expenses across all companies    │
│  • System analytics & reports                           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│               COMPANY ADMIN                              │
│      (Full Company Access - Single Company Only)        │
├─────────────────────────────────────────────────────────┤
│  • Manage users in company (add/edit/delete)            │
│  • Manage trucks in company                             │
│  • View all trips in company                            │
│  • Manage all expenses in company                       │
│  • Company analytics & reports                          │
│  • Cannot access other companies                        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                TRUCK ADMIN                               │
│      (Truck & Driver Management - Limited Scope)        │
├─────────────────────────────────────────────────────────┤
│  • Manage drivers assigned to their trucks              │
│  • View trips for their trucks only                     │
│  • Manage expenses for their trucks only                │
│  • Cannot access other trucks or drivers                │
│  • Cannot add new trucks                                │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                   DRIVER                                 │
│         (Trip & Expense Tracking - Own Data Only)       │
├─────────────────────────────────────────────────────────┤
│  • View assigned trucks only                            │
│  • Create trips for assigned trucks                     │
│  • Add expenses for own trips                           │
│  • Cannot modify others' data                           │
│  • Cannot access any admin functions                    │
└─────────────────────────────────────────────────────────┘
```

---

## Dashboard Navigation by Role

### 🔐 Superadmin Dashboard

**Sidebar Navigation:**
```
📊 Dashboard
🚗 Trips (all companies)

🏢 SYSTEM ADMIN
  🏢 Companies
  👥 All Users
  🚛 All Trucks
  📋 All Trips

⚙️ Settings
```

**Access Permissions:**
- View companies across entire system
- View all users across all companies
- Manage company creation/deletion
- View all trucks (filtered by company)
- View all trips (filtered by company)
- View all expenses (filtered by company)
- System-wide analytics
- Cannot directly modify company data (must use company admin)

---

### 🏢 Company Admin Dashboard

**Sidebar Navigation:**
```
📊 Dashboard
🚗 Trips (company only)

🏢 COMPANY CONTROL
  👥 Users
  🚛 Trucks
  💰 Expenses
  📈 Analytics

⚙️ Settings
```

**Access Permissions:**
- ✅ View company details
- ✅ Manage company users (create/edit/delete)
- ✅ Manage company trucks
- ✅ View all trips in company
- ✅ Manage all expenses in company
- ✅ Company analytics & reports
- ❌ Cannot access other companies
- ❌ Cannot create new companies
- ❌ Cannot delete company

---

### 🚛 Truck Admin Dashboard

**Sidebar Navigation:**
```
📊 Dashboard
🚗 Trips (assigned trucks only)

🚛 TRUCK MANAGEMENT
  👨‍✈️ Drivers
  💰 Expenses

⚙️ Settings
```

**Access Permissions:**
- ✅ View assigned trucks
- ✅ Manage drivers assigned to trucks
- ✅ View trips for assigned trucks
- ✅ Manage expenses for assigned trucks
- ✅ View driver performance
- ❌ Cannot create new trucks
- ❌ Cannot access other trucks
- ❌ Cannot manage other drivers
- ❌ Cannot access company admin functions

---

### 👨‍✈️ Driver Dashboard

**Sidebar Navigation:**
```
📊 Dashboard
🚗 Trips (own assignments)

👨‍✈️ OPERATIONS
  🚛 My Trucks
  ➕ Add Expense

⚙️ Settings
```

**Access Permissions:**
- ✅ View assigned trucks
- ✅ Create trips for assigned trucks
- ✅ Add expenses for own trips
- ✅ View own trip history
- ✅ View own expenses
- ❌ Cannot modify other trips
- ❌ Cannot access other drivers' data
- ❌ Cannot manage users
- ❌ Cannot manage trucks
- ❌ Cannot view expenses beyond own trips

---

## Data Access Isolation

### Query-Level Access Control

**Superadmin:**
```typescript
// Can query all data
const trips = await Trip.find({})
const users = await User.find({})
const trucks = await Truck.find({})
```

**Company Admin:**
```typescript
// Can only query own company
const trips = await Trip.find({ company_id: user.company_id })
const users = await User.find({ company_id: user.company_id })
const trucks = await Truck.find({ company_id: user.company_id })
```

**Truck Admin:**
```typescript
// Can only query own trucks
const trips = await Trip.find({ truck_id: user.assigned_trucks })
const drivers = await User.find({ truck_id: user.assigned_trucks })
```

**Driver:**
```typescript
// Can only query own data
const trips = await Trip.find({ driver_id: user.id })
const expenses = await Expense.find({ trip_id: user.my_trip_ids })
```

---

## API Endpoint Access Matrix

### Trips Endpoints

| Endpoint | Superadmin | Company Admin | Truck Admin | Driver |
|----------|-----------|--------------|-----------|--------|
| `GET /api/trips` | All trips | Company trips | Truck trips | Own trips |
| `POST /api/trips` | Any | Company only | Assigned trucks | Own trucks |
| `PUT /api/trips/[id]` | All | Company only | Truck trips | Own trips |
| `DELETE /api/trips/[id]` | All | Company only | Truck trips | ❌ No |

### Users Endpoints

| Endpoint | Superadmin | Company Admin | Truck Admin | Driver |
|----------|-----------|--------------|-----------|--------|
| `GET /api/users` | All users | Company users | ❌ No | ❌ No |
| `POST /api/users` | Any | Company only | ❌ No | ❌ No |
| `PUT /api/users/[id]` | All | Company only | ❌ No | ❌ Own profile |
| `DELETE /api/users/[id]` | All | Company only | ❌ No | ❌ No |

### Trucks Endpoints

| Endpoint | Superadmin | Company Admin | Truck Admin | Driver |
|----------|-----------|--------------|-----------|--------|
| `GET /api/trucks` | All | Company trucks | Assigned | Assigned |
| `POST /api/trucks` | Any | Company only | ❌ No | ❌ No |
| `PUT /api/trucks/[id]` | All | Company | Assigned | ❌ No |
| `DELETE /api/trucks/[id]` | All | Company | ❌ No | ❌ No |

### Expenses Endpoints

| Endpoint | Superadmin | Company Admin | Truck Admin | Driver |
|----------|-----------|--------------|-----------|--------|
| `GET /api/expenses` | All | Company | Truck only | Own only |
| `POST /api/expenses` | Any | Company | Truck | Own trips |
| `PUT /api/expenses/[id]` | All | Company | Truck | Own only |
| `DELETE /api/expenses/[id]` | All | Company | Truck | ❌ No |

---

## Implementation Details

### JWT Token Payload

Each user receives a token with their role and company:

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "admin@abc.com",
  "role": "company_admin",
  "companyId": "507f1f77bcf86cd799439012"
}
```

**Superadmin:** No companyId (system-wide access)  
**Others:** companyId set to their company

### Middleware Enforcement

```typescript
// lib/middleware.ts
export function withAuth(handler: Handler) {
  return async (req: NextRequest) => {
    const user = getTokenPayload(req)
    
    // Check role-based access
    if (user.role === 'company_admin') {
      req.company_id = user.companyId // Enforce company isolation
    }
    
    if (user.role === 'truck_admin') {
      req.truck_ids = user.assigned_trucks // Enforce truck isolation
    }
    
    if (user.role === 'driver') {
      req.driver_id = user.userId // Enforce personal isolation
    }
    
    return handler(req)
  }
}
```

### Query Scoping Pattern

All API endpoints must scope queries:

```typescript
// app/api/trips/route.ts
async function handler(req: NextRequest) {
  const user = (req as any).user
  
  let query: any = {}
  
  // Scope based on role
  if (user.role === 'superadmin') {
    // No filter - can see all
  } else if (user.role === 'company_admin') {
    query.company_id = user.companyId
  } else if (user.role === 'truck_admin') {
    query.truck_id = { $in: user.assigned_trucks }
  } else if (user.role === 'driver') {
    query.driver_id = user.userId
  }
  
  const trips = await Trip.find(query)
  return NextResponse.json(trips)
}
```

---

## Feature Access by Role

### Trip Management
- **Superadmin:** Create, view, edit, delete all trips
- **Company Admin:** Create, view, edit, delete company trips
- **Truck Admin:** Create, view, edit trips for assigned trucks
- **Driver:** Create, view own trips only

### Expense Management
- **Superadmin:** Full access to all expenses
- **Company Admin:** Full access to company expenses
- **Truck Admin:** Manage expenses for truck trips
- **Driver:** Add/view own trip expenses

### User Management
- **Superadmin:** Create/delete users across all companies
- **Company Admin:** Create/delete users in their company
- **Truck Admin:** Cannot manage users
- **Driver:** Cannot manage users

### Truck Management
- **Superadmin:** Full access to all trucks
- **Company Admin:** Manage trucks in their company
- **Truck Admin:** View assigned trucks (read-only)
- **Driver:** View assigned trucks (read-only)

### Analytics
- **Superadmin:** System-wide analytics
- **Company Admin:** Company analytics
- **Truck Admin:** Truck-specific metrics
- **Driver:** Personal trip analytics

---

## Security Considerations

### Data Isolation
1. Every query filters by user's accessible scope
2. Never trust client-side role declarations
3. Always verify server-side access before returning data

### Frontend Enforcement
1. Navigation hidden based on role
2. Forms pre-populated with company context
3. But **backend validation is mandatory**

### Audit Trail
Each API request logs:
- User ID
- Role
- Action (create/read/update/delete)
- Resource accessed
- Timestamp

---

## Creating Users by Role

### Superadmin Creates Company Admin
```bash
curl -X POST /api/admin/companies/{id}/users \
  -d '{
    "email": "admin@abc.com",
    "role": "company_admin"
  }'
```

### Company Admin Creates Truck Admin
```bash
curl -X POST /api/admin/companies/{companyId}/users \
  -d '{
    "email": "truck.admin@abc.com",
    "role": "truck_admin"
  }'
```

### Truck Admin Cannot Create Users
(No endpoint available for this role)

### Superadmin Creates Driver (For Any Company)
```bash
curl -X POST /api/admin/companies/{id}/users \
  -d '{
    "email": "driver@abc.com",
    "role": "driver"
  }'
```

---

## Migration from Old System

### Before (Single Role)
```typescript
role: 'owner' | 'driver' | 'admin'
```

### After (New Role-Based)
```typescript
role: 'superadmin' | 'company_admin' | 'truck_admin' | 'driver'
company_id: ObjectId (for non-superadmin users)
```

Backward compatibility:
- Old `owner` → `company_admin` + `company_id`
- Old `admin` → `superadmin` (no `company_id`)
- Old `driver` → `driver` + `company_id`

---

**Last Updated:** 2026-08-17
