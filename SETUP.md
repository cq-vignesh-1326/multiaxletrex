# Fleet Analytics Dashboard - Setup Guide

## Quick Start

### 1. Environment Setup

```bash
# Install dependencies (already done)
npm install

# Environment variables are already configured in .env.local
# Update these with your actual MongoDB URI and JWT secret
```

### 2. MongoDB Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new project and cluster (M0 free tier)
4. Click "Connect" and copy the connection string
5. Replace `MONGODB_URI` in `.env.local`:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fleet-db
```

### 3. Update Security Keys

Generate secure keys for JWT and encryption:

```bash
# Generate JWT Secret (run in terminal)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Encryption Key (must be 32 chars for AES-256)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Update `.env.local`:
```
JWT_SECRET=your_generated_jwt_secret_here
ENCRYPTION_KEY=your_32_character_encryption_key_here
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## Project Structure

```
multi-axle-trex/
├── app/                          # Next.js app directory
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   │
│   ├── login/                   # Login page
│   ├── register/                # Registration page
│   │
│   ├── dashboard/               # Protected dashboard
│   │   ├── layout.tsx           # Dashboard layout with sidebar
│   │   ├── page.tsx             # Dashboard home
│   │   ├── trips/               # Trip management
│   │   ├── vehicles/            # Vehicle management
│   │   ├── analytics/           # Analytics pages
│   │   ├── expenses/            # Expense tracking
│   │   └── settings/            # User settings
│   │
│   └── api/                     # Backend API routes
│       ├── auth/                # Authentication
│       │   ├── register/        # POST /api/auth/register
│       │   ├── login/           # POST /api/auth/login
│       │   ├── logout/          # POST /api/auth/logout
│       │   └── me/              # GET /api/auth/me
│       │
│       └── dashboard/
│           └── stats/           # GET /api/dashboard/stats
│
├── lib/                         # Utility functions
│   ├── db.ts                   # Database connection
│   ├── auth.ts                 # JWT utilities
│   ├── encryption.ts           # Password hashing & encryption
│   ├── validators.ts           # Zod validation schemas
│   └── middleware.ts           # Auth middleware
│
├── models/                      # MongoDB schemas
│   ├── User.ts
│   ├── Vehicle.ts
│   ├── Trip.ts
│   └── Expense.ts
│
├── components/                  # React components (to be created)
│   ├── auth/
│   ├── dashboard/
│   ├── forms/
│   ├── charts/
│   └── common/
│
├── public/                      # Static files
├── .env.local                   # Local environment variables
├── .env.example                 # Example env template
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript config
├── tailwind.config.ts          # Tailwind CSS config
├── next.config.js              # Next.js config
└── README.md                   # Project documentation
```

---

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  encryptedPassword: String (bcrypt hashed),
  owner_name: String,
  phone: String,
  company_name: String,
  role: String (owner/driver/admin),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Vehicles Collection
```javascript
{
  _id: ObjectId,
  owner_id: ObjectId (ref: User),
  vehicle_name: String,
  registration_number: String (unique),
  vehicle_type: String (truck/mini-truck/auto),
  capacity_tons: Number,
  fuel_type: String (diesel/petrol/cng),
  is_active: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Trips Collection
```javascript
{
  _id: ObjectId,
  owner_id: ObjectId (ref: User),
  vehicle_id: ObjectId (ref: Vehicle),
  source: String,
  destination: String,
  trip_date: Date,
  total_kms: Number,
  load_type: String,
  load_quantity: Number,
  diesel_consumed: Number,
  milage: Number (auto-calculated: KMS / diesel),
  total_income: Number,
  total_expenditure: Number,
  profit_loss: Number (auto-calculated),
  status: String (in-progress/completed/cancelled),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Expenses Collection
```javascript
{
  _id: ObjectId,
  trip_id: ObjectId (ref: Trip),
  owner_id: ObjectId (ref: User),
  expense_type: String (fuel/service/rto/pc/loading/unloading/driver_batta/commission/toll/check_post/other),
  amount: Number,
  location: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/auth/register` | `{email, password, owner_name, phone, company_name}` | User object + tokens |
| POST | `/api/auth/login` | `{email, password}` | User object + accessToken |
| POST | `/api/auth/logout` | - | Success message |
| GET | `/api/auth/me` | - | Current user object |

### Vehicles (to implement)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vehicles` | List all vehicles |
| POST | `/api/vehicles` | Create vehicle |
| GET | `/api/vehicles/[id]` | Get vehicle details |
| PUT | `/api/vehicles/[id]` | Update vehicle |
| DELETE | `/api/vehicles/[id]` | Delete vehicle |

### Trips (to implement)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips` | List trips with filters |
| POST | `/api/trips` | Create trip |
| GET | `/api/trips/[id]` | Get trip details |
| PUT | `/api/trips/[id]` | Update trip |
| DELETE | `/api/trips/[id]` | Delete trip |
| GET | `/api/trips/stats` | Get trip analytics |

### Expenses (to implement)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List expenses |
| POST | `/api/expenses` | Create expense |
| GET | `/api/expenses/[tripId]` | Get trip expenses |

---

## Development Tasks

### Phase 1: Core Features (Complete)
- ✅ Project setup
- ✅ Database schema
- ✅ Authentication (login/register)
- ✅ Dashboard structure
- ✅ Basic auth middleware

### Phase 2: Vehicle Management (To Do)
- [ ] Create vehicle API endpoints
- [ ] Vehicle list page
- [ ] Add/edit vehicle forms
- [ ] Vehicle CRUD operations

### Phase 3: Trip Management (To Do)
- [ ] Create trip API endpoints
- [ ] Trip list page
- [ ] Trip form with inline expense tracking
- [ ] Trip details view
- [ ] Status updates

### Phase 4: Expense Tracking (To Do)
- [ ] Create expense API endpoints
- [ ] Expense list by trip
- [ ] Quick expense entry
- [ ] Expense categorization

### Phase 5: Analytics & Reporting (To Do)
- [ ] Profit/loss charts
- [ ] Fuel efficiency analysis
- [ ] Route profitability
- [ ] Expense breakdown charts
- [ ] Export reports (PDF/CSV)

### Phase 6: Deployment (To Do)
- [ ] Configure Vercel deployment
- [ ] Set up MongoDB Atlas
- [ ] Environment variables setup
- [ ] SSL/HTTPS setup
- [ ] Performance optimization

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server on port 3000

# Build & Production
npm run build           # Build for production
npm start              # Start production server

# Type checking
npm run type-check     # Check TypeScript types

# Linting
npm run lint           # Run ESLint

# Database
# MongoDB Atlas: https://www.mongodb.com/cloud/atlas
```

---

## Security Checklist

- ✅ Passwords hashed with bcryptjs (12 rounds)
- ✅ JWT tokens in HTTP-only cookies
- ✅ CSRF protection with SameSite cookies
- ✅ Environment variables for secrets
- ✅ Input validation with Zod
- ✅ CORS headers configured
- ⚠️ TODO: Rate limiting on auth endpoints
- ⚠️ TODO: HTTPS in production
- ⚠️ TODO: Helmet security headers
- ⚠️ TODO: Input sanitization

---

## Troubleshooting

### MongoDB Connection Issues
```
Error: connect ECONNREFUSED
Solution: Ensure MongoDB Atlas connection string is correct and IP is whitelisted
```

### Port 3000 Already in Use
```bash
# Kill process on port 3000
# Windows: netstat -ano | findstr :3000
# Then: taskkill /PID <PID> /F

# Or use different port:
PORT=3001 npm run dev
```

### Build Errors
```bash
# Clear .next folder and reinstall
rm -r .next node_modules
npm install
npm run build
```

---

## Deployment to Vercel

1. Push code to GitHub
2. Go to https://vercel.com and sign in
3. Click "Add New..." → "Project"
4. Select your GitHub repository
5. Add Environment Variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `ENCRYPTION_KEY`
6. Click "Deploy"

---

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Configure `.env.local` with MongoDB URI
3. ✅ Run dev server: `npm run dev`
4. ✅ Test login/register at `http://localhost:3000`
5. [ ] Implement vehicle management API & UI
6. [ ] Implement trip management API & UI
7. [ ] Implement expense tracking
8. [ ] Add analytics & charts
9. [ ] Deploy to Vercel

---

## Support & Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Docs](https://docs.mongodb.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Zod Validation](https://zod.dev)
- [Recharts](https://recharts.org)
