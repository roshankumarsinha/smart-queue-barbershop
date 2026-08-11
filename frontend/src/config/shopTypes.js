import { Scissors, UtensilsCrossed, Stethoscope, HeartPulse, Landmark, ShoppingBag, Store } from 'lucide-react';

// The shop "kind" — mirrors com.smartqueue.domain.ShopType and the backend CHECK
// constraint. Single source of truth for the type-picker chips and the type badge
// shown on shop cards. `value` is exactly what the API expects.
export const SHOP_TYPES = [
  { value: 'SALON', label: 'Salon', icon: Scissors, blurb: 'Barbershop, spa, beauty' },
  { value: 'RESTAURANT', label: 'Restaurant', icon: UtensilsCrossed, blurb: 'Dine-in, cafe, takeaway' },
  { value: 'HOSPITAL', label: 'Hospital', icon: HeartPulse, blurb: 'Wards, departments' },
  { value: 'CLINIC', label: 'Clinic', icon: Stethoscope, blurb: 'Doctor, dental, OPD' },
  { value: 'GOVERNMENT', label: 'Government', icon: Landmark, blurb: 'Offices, service desks' },
  { value: 'RETAIL', label: 'Retail', icon: ShoppingBag, blurb: 'Stores, counters' },
  { value: 'OTHER', label: 'Other', icon: Store, blurb: 'Anything with a queue' },
];

export const DEFAULT_SHOP_TYPE = 'SALON';

const BY_VALUE = Object.fromEntries(SHOP_TYPES.map((t) => [t.value, t]));

export function getShopType(value) {
  return BY_VALUE[value] ?? BY_VALUE[DEFAULT_SHOP_TYPE];
}
