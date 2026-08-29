export interface Cabin {
  id: string;
  name: string;
  location: string | null;
  phone: string | null;
  whatsapp: string | null;
  base_currency: string;
  base_symbol: string;
  local_currency: string;
  local_symbol: string;
  buy_rate: number;
  sell_rate: number;
  updated_at: string;
  is_active: boolean;
  operator_id: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export type VendorStatus = 'available' | 'out_of_stock';

export interface Vendor {
  id: string;
  cabin_id: string;
  name: string;
  business_type: string;
  photo_url: string | null;
  status: VendorStatus;
  price_info: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface VendorProduct {
  id: string;
  vendor_id: string;
  name: string;
  price: number;
  unit: string | null;
  created_at: string;
}

export type SenderRole = 'client' | 'operator';

export interface Conversation {
  id: string;
  cabin_id: string;
  vendor_id: string | null;
  client_id: string;
  client_name: string | null;
  last_message_at: string | null;
  operator_last_read_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_role: SenderRole;
  body: string;
  created_at: string;
}
