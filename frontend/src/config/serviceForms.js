import { Clock, IndianRupee } from 'lucide-react';

// Per shop-type "add service" form. Every type picks a service from a dropdown; the
// EXTRA fields (and which are required) differ by type — this is the seam that lets a
// future restaurant/hospital have its own form. Mirrors the backend's ServiceRules.
//
// For SALON: estimated time is required (it feeds the queue), price is optional.
export const SERVICE_FORMS = {
  SALON: {
    fields: [
      {
        name: 'estimatedMinutes',
        label: 'Estimated time',
        placeholder: '30',
        icon: Clock,
        endHint: 'min',
        required: true,
        min: 1,
      },
      {
        name: 'price',
        label: 'Price (optional)',
        placeholder: '200',
        icon: IndianRupee,
        required: false,
        min: 0,
      },
    ],
  },
};

const DEFAULT_FORM = SERVICE_FORMS.SALON;

export function getServiceForm(shopType) {
  return SERVICE_FORMS[shopType] ?? DEFAULT_FORM;
}
