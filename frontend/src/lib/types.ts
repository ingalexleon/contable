export interface User {
  id: number
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: number
  business_name: string
  contact_name: string
  email: string
  phone: string
  tax_id: string
  client_type: 'persona_fisica' | 'persona_moral' | 'regimen_simplificado'
  address: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: number
}

export interface Service {
  id: number
  name: string
  description: string
  default_price: number
  category: string
  is_active: boolean
}

export interface ClientService {
  id: number
  client_id: number
  service_id: number
  custom_price: number | null
  is_active: boolean
  period: 'monthly' | 'annual'
  start_date: string
  service?: Service
  client?: Client
}

export interface Payment {
  id: number
  client_id: number
  amount: number
  payment_date: string
  period_start: string
  period_end: string
  status: 'pending' | 'paid' | 'overdue'
  notes: string
  client?: Client
}

export interface PaymentProof {
  id: number
  payment_id: number
  file_path: string
  file_type: string
  uploaded_at: string
  uploaded_by: number
}

export interface DashboardStats {
  total_clients: number
  active_services: number
  monthly_revenue: number
  pending_payments: number
  monthly_revenue_chart: { month: string; revenue: number }[]
  client_type_distribution: { type: string; count: number }[]
  top_services: { name: string; count: number }[]
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  skip: number
  limit: number
}
