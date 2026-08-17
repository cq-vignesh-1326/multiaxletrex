# API Documentation - Multi-Axle Trex

## Important: User Registration Flow

⚠️ **Self-registration is disabled** — Users cannot register through the portal UI.

**How users are created:**
1. **First Superadmin** → Created via `POST /api/auth/create-superadmin` with secret key
2. **Companies** → Created by superadmin via `POST /api/admin/companies`
3. **Company Users** → Added by superadmin/company admin via `POST /api/admin/companies/{id}/users`

**Portal UI:** Only login page is available. New users must be created by administrators through the API.

---

## Authentication & User Management

### 1. Create Superadmin

**Endpoint:** `POST /api/auth/create-superadmin`  
**Auth:** Required (header: `x-superadmin-secret`)  
**Role:** None (uses secret key)

**Request Header:**
```
x-superadmin-secret: your_super_secret_superadmin_key_change_this
```

**Request Body:**
```json
{
  "email": "superadmin@example.com",
  "password": "SecurePassword123",
  "full_name": "Super Admin",
  "phone": "9876543210"
}
```

**Response (201):**
```json
{
  "message": "Superadmin created successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "superadmin@example.com",
    "full_name": "Super Admin",
    "phone": "9876543210",
    "role": "superadmin"
  }
}
```

**Example with curl:**
```bash
curl -X POST http://localhost:3000/api/auth/create-superadmin \
  -H "Content-Type: application/json" \
  -H "x-superadmin-secret: your_super_secret_superadmin_key_change_this" \
  -d '{
    "email": "superadmin@example.com",
    "password": "SecurePassword123",
    "full_name": "Super Admin",
    "phone": "9876543210"
  }'
```

---

### 2. Login

**Endpoint:** `POST /api/auth/login`  
**Auth:** None  
**Role:** All users

**Request Body:**
```json
{
  "email": "superadmin@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "superadmin@example.com",
    "full_name": "Super Admin",
    "role": "superadmin"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Cookies Set:**
- `authToken` (HTTP-only, 7 days)
- `refreshToken` (HTTP-only, 30 days)

---

## Company Management (Superadmin Only)

### 3. Create Company

**Endpoint:** `POST /api/admin/companies`  
**Auth:** JWT Token (Cookie)  
**Role:** Superadmin only

**Request Body:**
```json
{
  "name": "ABC Transport & Logistics",
  "description": "Leading transport company in Tamil Nadu",
  "registration_number": "REG-2026-001",
  "phone": "9123456789",
  "email": "admin@abctransport.com",
  "address": "123 Main Street",
  "city": "Chennai",
  "state": "Tamil Nadu",
  "industry": "transport"
}
```

**Response (201):**
```json
{
  "message": "Company created successfully",
  "company": {
    "id": "507f1f77bcf86cd799439012",
    "name": "ABC Transport & Logistics",
    "registration_number": "REG-2026-001",
    "industry": "transport",
    "created_by": "507f1f77bcf86cd799439011"
  }
}
```

**Example with curl:**
```bash
curl -X POST http://localhost:3000/api/admin/companies \
  -H "Content-Type: application/json" \
  -b "authToken=<your_jwt_token>" \
  -d '{
    "name": "ABC Transport & Logistics",
    "description": "Leading transport company in Tamil Nadu",
    "registration_number": "REG-2026-001",
    "phone": "9123456789",
    "email": "admin@abctransport.com",
    "address": "123 Main Street",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "industry": "transport"
  }'
```

---

### 4. List All Companies

**Endpoint:** `GET /api/admin/companies`  
**Auth:** JWT Token (Cookie)  
**Role:** Superadmin only

**Response (200):**
```json
{
  "total": 2,
  "companies": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "ABC Transport & Logistics",
      "registration_number": "REG-2026-001",
      "industry": "transport",
      "phone": "9123456789",
      "email": "admin@abctransport.com",
      "is_active": true,
      "metadata": {
        "total_vehicles": 0,
        "total_users": 0
      },
      "createdAt": "2026-08-17T10:00:00Z"
    }
  ]
}
```

---

## Company User Management

### 5. Add User to Company

**Endpoint:** `POST /api/admin/companies/{companyId}/users`  
**Auth:** JWT Token (Cookie)  
**Role:** Superadmin or Company Admin (for their own company)

**Request Body:**
```json
{
  "email": "admin@abctransport.com",
  "password": "CompanyAdmin123",
  "full_name": "Company Admin User",
  "phone": "9876543210",
  "role": "company_admin"
}
```

**Roles:**
- `company_admin` - Full access to company
- `truck_admin` - Manage trucks and drivers
- `driver` - Driver account

**Response (201):**
```json
{
  "message": "company_admin added successfully to company",
  "user": {
    "id": "507f1f77bcf86cd799439013",
    "email": "admin@abctransport.com",
    "full_name": "Company Admin User",
    "phone": "9876543210",
    "role": "company_admin",
    "company_id": "507f1f77bcf86cd799439012"
  }
}
```

**Example - Add Company Admin:**
```bash
curl -X POST http://localhost:3000/api/admin/companies/507f1f77bcf86cd799439012/users \
  -H "Content-Type: application/json" \
  -b "authToken=<your_jwt_token>" \
  -d '{
    "email": "admin@abctransport.com",
    "password": "CompanyAdmin123",
    "full_name": "Company Admin User",
    "phone": "9876543210",
    "role": "company_admin"
  }'
```

**Example - Add Truck Admin:**
```bash
curl -X POST http://localhost:3000/api/admin/companies/507f1f77bcf86cd799439012/users \
  -H "Content-Type: application/json" \
  -b "authToken=<your_jwt_token>" \
  -d '{
    "email": "truckadmin@abctransport.com",
    "password": "TruckAdmin123",
    "full_name": "Truck Admin User",
    "phone": "9876543210",
    "role": "truck_admin"
  }'
```

**Example - Add Driver:**
```bash
curl -X POST http://localhost:3000/api/admin/companies/507f1f77bcf86cd799439012/users \
  -H "Content-Type: application/json" \
  -b "authToken=<your_jwt_token>" \
  -d '{
    "email": "driver1@abctransport.com",
    "password": "Driver123",
    "full_name": "Driver One",
    "phone": "9876543211",
    "role": "driver"
  }'
```

---

### 6. List Company Users

**Endpoint:** `GET /api/admin/companies/{companyId}/users`  
**Auth:** JWT Token (Cookie)  
**Role:** Superadmin or Company Admin (for their own company)

**Response (200):**
```json
{
  "company_id": "507f1f77bcf86cd799439012",
  "total": 3,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "email": "admin@abctransport.com",
      "full_name": "Company Admin User",
      "phone": "9876543210",
      "role": "company_admin",
      "company_id": "507f1f77bcf86cd799439012",
      "is_active": true,
      "createdAt": "2026-08-17T10:05:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "email": "truckadmin@abctransport.com",
      "full_name": "Truck Admin User",
      "phone": "9876543210",
      "role": "truck_admin",
      "company_id": "507f1f77bcf86cd799439012",
      "is_active": true,
      "createdAt": "2026-08-17T10:06:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439015",
      "email": "driver1@abctransport.com",
      "full_name": "Driver One",
      "phone": "9876543211",
      "role": "driver",
      "company_id": "507f1f77bcf86cd799439012",
      "is_active": true,
      "createdAt": "2026-08-17T10:07:00Z"
    }
  ]
}
```

---

## Quick Start Guide

### Step 1: Create Superadmin
```bash
curl -X POST http://localhost:3000/api/auth/create-superadmin \
  -H "Content-Type: application/json" \
  -H "x-superadmin-secret: your_super_secret_superadmin_key_change_this" \
  -d '{
    "email": "superadmin@example.com",
    "password": "SuperAdmin123",
    "full_name": "Super Admin",
    "phone": "9876543210"
  }'
```

### Step 2: Login as Superadmin
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@example.com",
    "password": "SuperAdmin123"
  }'
```

Copy the `accessToken` from response.

### Step 3: Create Company
```bash
curl -X POST http://localhost:3000/api/admin/companies \
  -H "Content-Type: application/json" \
  -b "authToken=<token_from_step_2>" \
  -d '{
    "name": "ABC Transport",
    "registration_number": "REG-001",
    "industry": "transport"
  }'
```

Copy the `id` from response (company ID).

### Step 4: Add Company Admin
```bash
curl -X POST http://localhost:3000/api/admin/companies/<company_id>/users \
  -H "Content-Type: application/json" \
  -b "authToken=<token_from_step_2>" \
  -d '{
    "email": "admin@abc.com",
    "password": "CompanyAdmin123",
    "full_name": "Company Admin",
    "phone": "9876543210",
    "role": "company_admin"
  }'
```

### Step 5: Add Drivers
```bash
curl -X POST http://localhost:3000/api/admin/companies/<company_id>/users \
  -H "Content-Type: application/json" \
  -b "authToken=<token_from_step_2>" \
  -d '{
    "email": "driver1@abc.com",
    "password": "Driver123",
    "full_name": "Driver 1",
    "phone": "9876543211",
    "role": "driver"
  }'
```

---

## Error Responses

### 400 - Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "fieldErrors": {
      "email": ["Invalid email address"]
    }
  }
}
```

### 401 - Unauthorized
```json
{
  "error": "Invalid or missing superadmin secret"
}
```

### 403 - Forbidden
```json
{
  "error": "Only superadmin can create companies"
}
```

### 409 - Conflict
```json
{
  "error": "User with this email already exists"
}
```

### 500 - Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Environment Configuration

Set in `.env.local`:
```
SUPERADMIN_SECRET=your_super_secret_superadmin_key_change_this
```

Change this to a strong random key for production!

---

## User Hierarchy

```
Superadmin (1)
    ↓
Company (Multiple)
    ├─ Company Admin (1 per company)
    ├─ Truck Admin (Multiple)
    └─ Drivers (Multiple)
```

Each company is isolated. Company Admins can only manage their own company users.

---

**Last Updated:** 2026-08-17
