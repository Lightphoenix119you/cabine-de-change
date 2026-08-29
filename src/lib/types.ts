export interface Bureau {
  id: string;
  name: string;
  municipality: string;
  address: string | null;
  address_description: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  verified: boolean;
  user_id: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  role: 'client' | 'admin';
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface LocalVendor {
  id: string;
  bureau_id: string;
  name: string;
  category: string;
  products_summary: string | null;
  photo_url: string | null;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface ExchangeRate {
  id: string;
  bureau_id: string;
  usd_buy: number | null;
  usd_sell: number | null;
  status: 'pending' | 'verified';
  updated_at: string;
}

export interface BureauWithRate extends Bureau {
  rates: ExchangeRate[];
  latest?: ExchangeRate;
  distanceKm?: number | null;
}

export type RateMode = 'buy' | 'sell';
export type Currency = 'USD' | 'CDF' | 'EUR' | 'ZAR';
