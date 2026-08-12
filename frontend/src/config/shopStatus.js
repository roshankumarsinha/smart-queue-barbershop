// Shared styling for the three-state shop lifecycle (NEW / OPEN / CLOSED), used by
// the owner's shop list and the shop-services screen so the chip looks identical.
export const SHOP_STATUS_STYLES = {
  NEW: { label: 'NEW', color: 'primary.dark', bg: 'rgba(200,155,60,0.18)', dot: '#C89B3C' },
  OPEN: { label: 'OPEN', color: 'success.main', bg: 'rgba(63,122,87,0.15)', dot: '#3F7A57' },
  CLOSED: { label: 'CLOSED', color: 'text.secondary', bg: 'rgba(107,93,79,0.15)', dot: '#6B5D4F' },
};

export function getStatusStyle(status) {
  return SHOP_STATUS_STYLES[status] ?? SHOP_STATUS_STYLES.CLOSED;
}
