# Testing Superadmin & Company APIs

## Quick Start - 5 Minutes

### 1. Update Environment Variable

Open `.env.local` and change `SUPERADMIN_SECRET` to something unique:
```
SUPERADMIN_SECRET=my_super_secret_key_12345
```

### 2. Start Dev Server
```bash
npm run dev
```

Open http://localhost:3000

### 3. Create Superadmin

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/auth/create-superadmin \
  -H "Content-Type: application/json" \
  -H "x-superadmin-secret: my_super_secret_key_12345" \
  -d '{
    "email": "superadmin@test.com",
    "password": "SuperAdmin@123",
    "full_name": "System Administrator",
    "phone": "9876543210"
  }'
```

**Expected Response:**
```json
{
  "message": "Superadmin created successfully",
  "user": {
    "id": "...",
    "email": "superadmin@test.com",
    "full_name": "System Administrator",
    "phone": "9876543210",
    "role": "superadmin"
  }
}
```

### 4. Login as Superadmin

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "superadmin@test.com",
    "password": "SuperAdmin@123"
  }'
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "email": "superadmin@test.com",
    "full_name": "System Administrator",
    "role": "superadmin"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Note:** The `-c cookies.txt` saves the auth cookie for next requests.

### 5. Create a Company

```bash
curl -X POST http://localhost:3000/api/admin/companies \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "ABC Transport Services",
    "registration_number": "REG-2026-001",
    "phone": "9123456789",
    "email": "info@abc.com",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "industry": "transport"
  }'
```

**Expected Response:**
```json
{
  "message": "Company created successfully",
  "company": {
    "id": "507f1f77bcf86cd799439012",
    "name": "ABC Transport Services",
    "registration_number": "REG-2026-001",
    "industry": "transport",
    "created_by": "507f1f77bcf86cd799439011"
  }
}
```

**Copy the company ID** from response.

### 6. Add Company Admin

```bash
curl -X POST http://localhost:3000/api/admin/companies/507f1f77bcf86cd799439012/users \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "email": "company.admin@abc.com",
    "password": "CompanyAdmin@123",
    "full_name": "Ramesh Kumar",
    "phone": "9876543210",
    "role": "company_admin"
  }'
```

**Expected Response:**
```json
{
  "message": "company_admin added successfully to company",
  "user": {
    "id": "507f1f77bcf86cd799439013",
    "email": "company.admin@abc.com",
    "full_name": "Ramesh Kumar",
    "phone": "9876543210",
    "role": "company_admin",
    "company_id": "507f1f77bcf86cd799439012"
  }
}
```

### 7. Add Truck Admin

```bash
curl -X POST http://localhost:3000/api/admin/companies/507f1f77bcf86cd799439012/users \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "email": "truck.admin@abc.com",
    "password": "TruckAdmin@123",
    "full_name": "Vikram Singh",
    "phone": "9876543211",
    "role": "truck_admin"
  }'
```

### 8. Add Driver

```bash
curl -X POST http://localhost:3000/api/admin/companies/507f1f77bcf86cd799439012/users \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "email": "driver1@abc.com",
    "password": "Driver@123",
    "full_name": "Suresh Kumar",
    "phone": "9876543212",
    "role": "driver"
  }'
```

### 9. List Company Users

```bash
curl -X GET http://localhost:3000/api/admin/companies/507f1f77bcf86cd799439012/users \
  -b cookies.txt
```

**Expected Response:**
```json
{
  "company_id": "507f1f77bcf86cd799439012",
  "total": 3,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "email": "company.admin@abc.com",
      "full_name": "Ramesh Kumar",
      "phone": "9876543210",
      "role": "company_admin",
      "company_id": "507f1f77bcf86cd799439012",
      "is_active": true,
      "createdAt": "2026-08-17T10:05:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "email": "truck.admin@abc.com",
      "full_name": "Vikram Singh",
      "phone": "9876543211",
      "role": "truck_admin",
      "company_id": "507f1f77bcf86cd799439012",
      "is_active": true,
      "createdAt": "2026-08-17T10:06:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439015",
      "email": "driver1@abc.com",
      "full_name": "Suresh Kumar",
      "phone": "9876543212",
      "role": "driver",
      "company_id": "507f1f77bcf86cd799439012",
      "is_active": true,
      "createdAt": "2026-08-17T10:07:00Z"
    }
  ]
}
```

### 10. List All Companies

```bash
curl -X GET http://localhost:3000/api/admin/companies \
  -b cookies.txt
```

---

## Using Postman

1. **Create New Collection** → "Fleet Analytics"

2. **Add Request 1: Create Superadmin**
   - Method: `POST`
   - URL: `http://localhost:3000/api/auth/create-superadmin`
   - Headers: 
     - `Content-Type: application/json`
     - `x-superadmin-secret: my_super_secret_key_12345`
   - Body (raw JSON):
     ```json
     {
       "email": "superadmin@test.com",
       "password": "SuperAdmin@123",
       "full_name": "System Administrator",
       "phone": "9876543210"
     }
     ```

3. **Add Request 2: Login**
   - Method: `POST`
   - URL: `http://localhost:3000/api/auth/login`
   - Headers: `Content-Type: application/json`
   - Body:
     ```json
     {
       "email": "superadmin@test.com",
       "password": "SuperAdmin@123"
     }
     ```
   - **After sending**, copy the `accessToken` from response
   - Go to **Tests** tab and add:
     ```javascript
     if (pm.response.code === 200) {
       pm.environment.set("authToken", pm.response.json().accessToken);
     }
     ```

4. **Add Request 3: Create Company**
   - Method: `POST`
   - URL: `http://localhost:3000/api/admin/companies`
   - Headers: 
     - `Content-Type: application/json`
     - `Cookie: authToken={{authToken}}`
   - Body:
     ```json
     {
       "name": "ABC Transport Services",
       "registration_number": "REG-2026-001",
       "phone": "9123456789",
       "email": "info@abc.com",
       "city": "Chennai",
       "state": "Tamil Nadu",
       "industry": "transport"
     }
     ```
   - **After sending**, in **Tests** tab:
     ```javascript
     if (pm.response.code === 201) {
       pm.environment.set("companyId", pm.response.json().company.id);
     }
     ```

5. **Add Request 4: Add Company Admin**
   - Method: `POST`
   - URL: `http://localhost:3000/api/admin/companies/{{companyId}}/users`
   - Headers: 
     - `Content-Type: application/json`
     - `Cookie: authToken={{authToken}}`
   - Body:
     ```json
     {
       "email": "company.admin@abc.com",
       "password": "CompanyAdmin@123",
       "full_name": "Ramesh Kumar",
       "phone": "9876543210",
       "role": "company_admin"
     }
     ```

---

## Error Testing

### Missing Secret
```bash
curl -X POST http://localhost:3000/api/auth/create-superadmin \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", ...}'
```
**Response (401):**
```json
{
  "error": "Invalid or missing superadmin secret"
}
```

### Wrong Secret
```bash
curl -X POST http://localhost:3000/api/auth/create-superadmin \
  -H "x-superadmin-secret: wrong_secret" \
  -d '{...}'
```
**Response (401):**
```json
{
  "error": "Invalid or missing superadmin secret"
}
```

### Duplicate Email
```bash
curl -X POST http://localhost:3000/api/auth/create-superadmin \
  -H "x-superadmin-secret: my_super_secret_key_12345" \
  -d '{"email": "superadmin@test.com", ...}'
```
**Response (409):**
```json
{
  "error": "User with this email already exists"
}
```

### Non-Superadmin Creating Company
1. Create regular user (driver role)
2. Login as driver
3. Try to create company
**Response (403):**
```json
{
  "error": "Only superadmin can create companies"
}
```

---

## Data Flow for Testing

```
1. Create Superadmin (secret header required)
   ↓
2. Login as Superadmin (get JWT token)
   ↓
3. Create Company (token in cookie)
   ↓
4. Add Company Admin to Company (token + companyId)
   ↓
5. Add Truck Admin to Company
   ↓
6. Add Drivers to Company
   ↓
7. Drivers can now create trips and track expenses
```

---

## Cleanup (Delete All Test Data)

To reset the database:
1. Go to MongoDB Atlas dashboard
2. Connect to cluster
3. Delete collections: `users`, `companies`
4. Repeat testing steps

Or use MongoDB shell:
```bash
db.users.deleteMany({})
db.companies.deleteMany({})
```

---

**Last Updated:** 2026-08-17
