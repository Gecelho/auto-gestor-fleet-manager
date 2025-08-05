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
  status: 'quitado' | 'andamento' | 'alugado';
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  car_id: string;
  description: string;
  observation?: string;
  mileage?: number;
  next_mileage?: number;
  value: number;
  date: string;
  created_at: string;
}

export interface Revenue {
  id: string;
  car_id: string;
  description: string;
  value: number;
  date: string;
  type: 'aluguel' | 'venda' | 'outros';
  created_at: string;
}

export interface Driver {
  id: string;
  car_id: string;
  name: string;
  phone?: string;
  cpf?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface CarWithFinancials extends Car {
  totalRevenue: number;
  totalExpenses: number;
  remainingBalance: number;
}