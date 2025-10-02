import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  email: string;
  name: string;
  balance: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: string;
  image_url: string;
  title: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_best_seller: boolean;
  stock: number;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  product_id: string;
  amount: number;
  status: string;
  product_details?: any;
  qris_payment_id?: string;
  created_at: string;
}

export interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  qris_payment_id?: string;
  created_at: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
  min_purchase: number;
  max_usage: number | null;
  current_usage: number;
  valid_until: string | null;
  created_at: string;
}

export interface ProductInventory {
  id: string;
  product_id: string;
  email: string;
  password: string;
  is_sold: boolean;
  order_id: string | null;
  created_at: string;
}

export interface QRISPayment {
  id: string;
  user_id: string;
  qris_code: string;
  qris_url: string;
  amount: number;
  type: 'deposit' | 'purchase';
  reference_id: string | null;
  status: 'pending' | 'completed' | 'expired' | 'failed';
  created_at: string;
  expires_at: string;
}
