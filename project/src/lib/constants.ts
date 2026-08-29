import type { Currency } from './types';

export const ADMIN_EMAIL = 'admin@cabinedechange.cd';

export const MUNICIPALITIES = [
  'Gombe',
  'Ngaliema',
  'Limete',
  'Lemba',
  'Matonge',
  'Kintambo',
  'Bandalungwa',
  'Kinshasa',
  'Barumbu',
  'Makala',
  'Lemba Immo',
  'Ngaba',
  'Kasa-Vubu',
  'Autre',
];

export const KINSHASA_CENTER: [number, number] = [-4.325, 15.3222];

export const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: 'USD', symbol: '$', label: 'Dollar américain' },
  { code: 'CDF', symbol: 'FC', label: 'Franc congolais' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'ZAR', symbol: 'R', label: 'Rand sud-africain' },
];

// Approximate fixed cross rates against USD used for the converter's non-CDF pairs.
// USD/CDF is always derived live from the best bureau rate.
export const STATIC_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  ZAR: 18.4,
  CDF: 2000, // placeholder, replaced by live best rate
};
