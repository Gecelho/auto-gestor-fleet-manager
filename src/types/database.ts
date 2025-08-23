// Updated types reflecting the correct user/driver relationship

export interface User {
  id: string; // UUID from auth.users
  full_name?: string;
  email: string;
  phone?: string;
  company_name?: string;
  subscription_status: 'active' | 'expired' | 'trial' | 'suspended';
  subscription_plan: 'basic' | 'premium' | 'enterprise';
  subscription_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Car {
  id: string;
  name: string;
  plate: string;
  image_url?: string;
  purchase_value: number;
  payment_method?: string;
  purchase_date?: string;
  mileage?: number;
  notes?: string;
  status?: 'quitado' | 'andamento' | 'alugado';
  user_id: string; // Belongs to car owner (User)
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  cpf?: string;
  address?: string;
  car_id: string; // Which car they drive
  owner_id: string; // Who hired them (User, NOT auth user)
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  car_id: string;
  description: string;
  value: number;
  date: string;
  category: 'manutenção' | 'documentos' | 'seguro' | 'outros';
  user_id: string; // Belongs to car owner (User)
  created_at: string;
}

export interface Revenue {
  id: string;
  car_id: string;
  description: string;
  value: number;
  date: string;
  type: 'aluguel' | 'venda' | 'outros';
  user_id: string; // Belongs to car owner (User)
  created_at: string;
}

// Extended types with relationships
export interface CarWithDriver extends Car {
  driver?: Driver;
}

export interface CarWithFinancials extends Car {
  expenses?: Expense[];
  revenues?: Revenue[];
  total_expenses?: number;
  total_revenues?: number;
  profit?: number;
}

export interface DriverWithCar extends Driver {
  car?: Car;
}

// Form types
export interface CarFormData {
  name: string;
  plate: string;
  image_url?: string;
  purchase_value: number;
  payment_method?: string;
  purchase_date?: string;
  mileage?: number;
  notes?: string;
  status?: 'quitado' | 'andamento' | 'alugado';
}

export interface DriverFormData {
  name: string;
  phone?: string;
  cpf?: string;
  address?: string;
  car_id: string;
}

// Insert types (without auto-generated fields)
export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type CarInsert = Omit<Car, 'id' | 'created_at' | 'updated_at'>;
export type DriverInsert = Omit<Driver, 'id' | 'created_at' | 'updated_at' | 'owner_id'>;
export type ExpenseInsert = Omit<Expense, 'id' | 'created_at' | 'user_id'>;
export type RevenueInsert = Omit<Revenue, 'id' | 'created_at' | 'user_id'>;

export interface ExpenseFormData {
  car_id: string;
  description: string;
  value: number;
  date: string;
  category: 'manutenção' | 'documentos' | 'seguro' | 'outros';
}

export interface RevenueFormData {
  car_id: string;
  description: string;
  value: number;
  date: string;
  type: 'aluguel' | 'venda' | 'outros';
}

// Database insert/update types
export interface CarInsert extends Omit<Car, 'id' | 'created_at' | 'updated_at' | 'user_id'> {
  id?: string;
  user_id?: string; // Will be set automatically by trigger
  created_at?: string;
  updated_at?: string;
}

export interface DriverInsert extends Omit<Driver, 'id' | 'created_at' | 'updated_at' | 'owner_id'> {
  id?: string;
  owner_id?: string; // Will be set automatically by trigger
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseInsert extends Omit<Expense, 'id' | 'created_at' | 'user_id'> {
  id?: string;
  user_id?: string; // Will be set automatically by trigger
  created_at?: string;
}

export interface RevenueInsert extends Omit<Revenue, 'id' | 'created_at' | 'user_id'> {
  id?: string;
  user_id?: string; // Will be set automatically by trigger
  created_at?: string;
}