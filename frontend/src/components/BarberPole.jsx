// The animated barber-pole stripe bar.
//
// `.barber-stripe` (defined in index.css) paints the diagonal 3-colour pattern;
// `animate-barber-pole` (defined in tailwind.config.js) scrolls it continuously
// and subtly, like a real rotating pole. Purely decorative.
export default function BarberPole({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`barber-stripe animate-barber-pole ${className}`}
    />
  );
}
