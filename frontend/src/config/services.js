// Service types offered — must match the backend's ServiceType (see
// backend/src/common/constants.ts).
export const SERVICES = [
  { value: 'HAIRCUT', label: 'Haircut' },
  { value: 'BEARD', label: 'Beard' },
  { value: 'HAIRCUT_BEARD', label: 'Haircut + Beard' },
];

export const serviceLabel = (value) =>
  SERVICES.find((s) => s.value === value)?.label ?? value;
