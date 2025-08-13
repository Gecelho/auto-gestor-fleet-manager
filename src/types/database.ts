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

export interface CarMileageConfig {
  id: string;
  car_id: string;
  weekly_km_limit: number;
  overage_rate_per_km: number;
  created_at: string;
  updated_at: string;
}

export interface WeeklyMileageControl {
  id: string;
  car_id: string;
  week_start_date: string;
  week_end_date: string;
  planned_km: number;
  used_km: number;
  remaining_km: number;
  overage_km: number;
  overage_fee: number;
  created_at: string;
  updated_at: string;
}

export interface MileageBalance {
  id: string;
  car_id: string;
  accumulated_km: number;
  last_updated: string;
}

export interface WeeklyMileageSummary extends WeeklyMileageControl {
  car_name: string;
  car_plate: string;
  driver_name?: string;
  weekly_km_limit: number;
  overage_rate_per_km: number;
  accumulated_km: number;
}