# Fleet Analytics Dashboard

A comprehensive web dashboard for tracking and analyzing truck operations, expenses, and profitability in Tamil Nadu.

## Features

- **Trip Management**: Track trips from source to destination
- **Expense Tracking**: Monitor all operational costs including fuel, tolls, RTO charges, bribes, and wages
- **Analytics Dashboard**: Real-time insights on profitability, fuel efficiency, and route analytics
- **Fleet Management**: Manage multiple vehicles and operators
- **Financial Reporting**: Detailed profit/loss analysis per trip

## Tech Stack

- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Backend**: Next.js API Routes (Serverless)
- **Database**: MongoDB
- **Authentication**: JWT with encrypted credentials
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB Atlas account
- Vercel account (for deployment)

### Installation

1. Clone the repository and install dependencies:
```bash
cd multi-axle-trex
npm install
```

2. Create `.env.local` file with your environment variables:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with:
   - MongoDB connection string
   - JWT secret
   - Encryption key

4. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
multi-axle-trex/
├── app/                      # Next.js app directory
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── (auth)/              # Auth pages group
│   │   ├── login/           # Login page
│   │   └── register/        # Register page
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── layout.tsx       # Dashboard layout
│   │   ├── page.tsx         # Dashboard home
│   │   ├── trips/           # Trip management
│   │   ├── vehicles/        # Vehicle management
│   │   ├── analytics/       # Analytics pages
│   │   └── settings/        # User settings
│   └── api/                 # API routes
│       ├── auth/            # Auth endpoints
│       ├── trips/           # Trip endpoints
│       ├── vehicles/        # Vehicle endpoints
│       └── expenses/        # Expense endpoints
├── lib/                      # Utilities and helpers
│   ├── db.ts               # Database connection
│   ├── auth.ts             # Auth utilities
│   ├── encryption.ts       # Encryption utilities
│   ├── validators.ts       # Zod schemas
│   └── middleware.ts       # Custom middleware
├── models/                   # MongoDB schemas
│   ├── User.ts
│   ├── Vehicle.ts
│   ├── Trip.ts
│   └── Expense.ts
├── components/               # React components
│   ├── auth/
│   ├── dashboard/
│   ├── forms/
│   ├── charts/
│   └── common/
├── public/                   # Static files
├── styles/                   # Global styles
├── .env.local               # Environment variables (local)
├── .env.example             # Environment template
├── tsconfig.json            # TypeScript config
├── tailwind.config.ts       # Tailwind config
├── next.config.js           # Next.js config
└── package.json             # Dependencies
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login and get JWT
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Vehicles
- `GET /api/vehicles` - List all vehicles
- `POST /api/vehicles` - Create vehicle
- `GET /api/vehicles/[id]` - Get vehicle details
- `PUT /api/vehicles/[id]` - Update vehicle
- `DELETE /api/vehicles/[id]` - Delete vehicle

### Trips
- `GET /api/trips` - List trips (with filters)
- `POST /api/trips` - Create trip
- `GET /api/trips/[id]` - Get trip details
- `PUT /api/trips/[id]` - Update trip
- `DELETE /api/trips/[id]` - Delete trip
- `GET /api/trips/stats` - Get analytics

### Expenses
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/[tripId]` - Get trip expenses

## Database Schema

### Users
```javascript
{
  email: String,
  encryptedPassword: String,
  owner_name: String,
  phone: String,
  company_name: String,
  role: String,
  createdAt: Date
}
```

### Vehicles
```javascript
{
  owner_id: ObjectId,
  vehicle_name: String,
  registration_number: String,
  capacity_tons: Number,
  fuel_type: String
}
```

### Trips
```javascript
{
  owner_id: ObjectId,
  vehicle_id: ObjectId,
  source: String,
  destination: String,
  trip_date: Date,
  total_kms: Number,
  load_type: String,
  diesel_consumed: Number,
  total_income: Number,
  total_expenditure: Number,
  profit_loss: Number
}
```

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables in Vercel settings
4. Deploy

```bash
vercel deploy --prod
```

## Environment Variables

Required variables in production:
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `ENCRYPTION_KEY` - Key for password encryption
- `NODE_ENV` - Set to 'production'

## Development

### Run tests
```bash
npm run test
```

### Type checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## Security

- Passwords are hashed using bcryptjs
- JWT tokens stored in HTTP-only cookies
- CSRF protection enabled
- Input validation with Zod
- Environment variables for secrets
- Rate limiting on auth endpoints

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
