import { z } from 'zod'

// Auth Schemas
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  owner_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Superadmin Schemas
export const CreateSuperAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
})

// Company Schemas
export const CreateCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  description: z.string().optional(),
  registration_number: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  industry: z.enum(['transport', 'logistics', 'other']).default('transport'),
})

// Company User Schemas
export const AddCompanyUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  role: z.enum(['company_admin', 'truck_admin', 'driver']),
})

// Vehicle Schemas
export const VehicleSchema = z.object({
  vehicle_name: z.string().min(1, 'Vehicle name is required'),
  registration_number: z.string().min(1, 'Registration number is required'),
  vehicle_type: z.enum(['truck', 'mini-truck', 'auto', 'other']),
  capacity_tons: z.number().min(1, 'Capacity must be at least 1 ton'),
  fuel_type: z.enum(['diesel', 'petrol', 'cng']).default('diesel'),
})

// Trip Schemas
export const TripSchema = z.object({
  vehicle_id: z.string().min(1, 'Vehicle is required'),
  source: z.string().min(1, 'Source location is required'),
  destination: z.string().min(1, 'Destination is required'),
  trip_date: z.string().datetime(),
  total_kms: z.number().min(0, 'Total KMS must be positive'),
  load_type: z.string().min(1, 'Load type is required'),
  load_quantity: z.number().min(0, 'Load quantity must be positive'),
  diesel_consumed: z.number().min(0, 'Diesel consumed must be positive'),
  total_income: z.number().min(0, 'Income must be positive'),
  total_expenditure: z.number().min(0, 'Expenditure must be non-negative'),
})

// Expense Schemas
export const ExpenseSchema = z.object({
  trip_id: z.string().min(1, 'Trip is required'),
  expense_type: z.enum([
    'fuel',
    'service',
    'rto',
    'pc',
    'loading',
    'unloading',
    'driver_batta',
    'commission',
    'toll',
    'check_post',
    'other',
  ]),
  amount: z.number().min(0, 'Amount must be non-negative'),
  location: z.string().min(1, 'Location is required'),
  notes: z.string().optional(),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type CreateSuperAdminInput = z.infer<typeof CreateSuperAdminSchema>
export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>
export type AddCompanyUserInput = z.infer<typeof AddCompanyUserSchema>
export type VehicleInput = z.infer<typeof VehicleSchema>
export type TripInput = z.infer<typeof TripSchema>
export type ExpenseInput = z.infer<typeof ExpenseSchema>
