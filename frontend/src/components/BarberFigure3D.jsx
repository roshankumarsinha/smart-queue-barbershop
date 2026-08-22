import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

/*
 * A cute, chibi-proportioned barber mascot built from three.js primitives (no
 * external model, so it ships inside the bundle and works offline in Capacitor).
 * It slowly revolves on a brass turntable beside the "Logged in as" header — and
 * when you tap it, it turns to face you, waves, and pops a "Hi!" speech bubble.
 *
 * Palette follows the Smart Queue design language (oxblood shirt, ivory apron,
 * brass accents). Motion is disabled under prefers-reduced-motion (the Canvas
 * renders a single static frame via frameloop="demand"); three.js is code-split
 * — DashboardShell lazy-loads this so the login bundle stays lean.
 */

const SKIN = '#F2C79E';
const SKIN_SHADE = '#E3A87C';
const HAIR = '#4A3626'; // lifted off pure-dark so it separates from the charcoal bg
const SHIRT = '#7B2D2D'; // oxblood
const APRON = '#F3ECDF'; // ivory
const BRASS = '#C89B3C';
const BRASS_DARK = '#A67C2E';
const PANTS = '#241A14'; // ink
const CHEEK = '#E79A86';
const WHITE = '#FBF7EF';

// Framer damp-style lerp toward a target (frame-rate independent enough here).
function approach(current, target, rate, dt) {
  return current + (target - current) * Math.min(1, rate * dt);
}

function Barber({ spin, waving, onPoke }) {
  const group = useRef(null);
  const waveArm = useRef(null);
  const restZ = -0.32; // arm hangs slightly out at rest
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    const g = group.current;
    const arm = waveArm.current;
    if (!g) return;
    const t = state.clock.elapsedTime;

    if (waving) {
      // Turn to face the viewer, then raise the arm up-and-out and wave it.
      g.rotation.y = approach(g.rotation.y, 0, 8, delta);
      g.position.y = approach(g.position.y, -0.15, 8, delta);
      if (arm) arm.rotation.z = 2.7 + Math.sin(t * 12) * 0.32;
    } else {
      if (arm) arm.rotation.z = approach(arm.rotation.z, restZ, 8, delta);
      if (spin) {
        g.rotation.y += delta * 0.5; // calm turntable, ~one turn / 12s
        g.position.y = -0.15 + Math.sin(t * 1.4) * 0.05; // gentle idle bob
      }
    }
  });

  return (
    <group
      ref={group}
      position={[0, -0.15, 0]}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPoke();
      }}
      onPointerOver={() => {
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      scale={hovered ? 1.04 : 1}
    >
      {/* Turntable pedestal */}
      <mesh position={[0, -1.5, 0]}>
        <cylinderGeometry args={[0.92, 1.02, 0.16, 44]} />
        <meshStandardMaterial color={BRASS} metalness={0.75} roughness={0.28} />
      </mesh>
      <mesh position={[0, -1.41, 0]}>
        <cylinderGeometry args={[0.78, 0.78, 0.04, 44]} />
        <meshStandardMaterial color={BRASS_DARK} metalness={0.75} roughness={0.32} />
      </mesh>

      {/* Stubby legs */}
      {[-0.24, 0.24].map((x) => (
        <mesh key={x} position={[x, -1.15, 0.02]}>
          <capsuleGeometry args={[0.19, 0.24, 6, 16]} />
          <meshStandardMaterial color={PANTS} roughness={0.9} />
        </mesh>
      ))}

      {/* Chibi torso (oxblood shirt) */}
      <mesh position={[0, -0.55, 0]}>
        <capsuleGeometry args={[0.5, 0.4, 8, 24]} />
        <meshStandardMaterial color={SHIRT} roughness={0.7} />
      </mesh>

      {/* Ivory apron over the front */}
      <RoundedBox args={[0.76, 0.92, 0.14]} radius={0.12} smoothness={5} position={[0, -0.6, 0.4]}>
        <meshStandardMaterial color={APRON} roughness={0.85} />
      </RoundedBox>
      {/* Brass bow tie at the collar — cute barbershop flourish */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.11, -0.16, 0.46]} rotation={[0, 0, s * 0.5]}>
          <coneGeometry args={[0.1, 0.18, 3]} />
          <meshStandardMaterial color={BRASS} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, -0.16, 0.48]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color={BRASS_DARK} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Left arm (static, at rest) */}
      <group position={[-0.5, -0.2, 0.05]} rotation={[0, 0, 0.32]}>
        <mesh position={[0, -0.28, 0]}>
          <capsuleGeometry args={[0.14, 0.42, 6, 16]} />
          <meshStandardMaterial color={SHIRT} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.56, 0]}>
          <sphereGeometry args={[0.15, 18, 18]} />
          <meshStandardMaterial color={SKIN} roughness={0.6} />
        </mesh>
      </group>

      {/* Right arm — pivots at the shoulder so it can wave */}
      <group ref={waveArm} position={[0.5, -0.2, 0.08]} rotation={[0, 0, restZ]}>
        <mesh position={[0, -0.28, 0]}>
          <capsuleGeometry args={[0.14, 0.42, 6, 16]} />
          <meshStandardMaterial color={SHIRT} roughness={0.7} />
        </mesh>
        {/* Rolled-up cuff so the raised hand reads clearly */}
        <mesh position={[0, -0.52, 0]}>
          <cylinderGeometry args={[0.17, 0.17, 0.1, 16]} />
          <meshStandardMaterial color={APRON} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.66, 0]}>
          <sphereGeometry args={[0.18, 20, 20]} />
          <meshStandardMaterial color={SKIN} roughness={0.6} />
        </mesh>
      </group>

      {/* Neck */}
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.18, 16]} />
        <meshStandardMaterial color={SKIN_SHADE} roughness={0.7} />
      </mesh>

      {/* Big cute head */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.62, 40, 40]} />
        <meshStandardMaterial color={SKIN} roughness={0.5} />
      </mesh>
      {/* Hair cap + little top tuft */}
      <mesh position={[0, 0.74, -0.06]} scale={[1.04, 0.66, 1.06]}>
        <sphereGeometry args={[0.62, 32, 32]} />
        <meshStandardMaterial color={HAIR} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.16, -0.02]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color={HAIR} roughness={0.85} />
      </mesh>

      {/* Eyes: white + dark pupil + highlight */}
      {[-0.22, 0.22].map((x) => (
        <group key={x} position={[x, 0.54, 0.5]}>
          <mesh>
            <sphereGeometry args={[0.13, 20, 20]} />
            <meshStandardMaterial color={WHITE} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.09]}>
            <sphereGeometry args={[0.075, 18, 18]} />
            <meshStandardMaterial color={HAIR} roughness={0.35} />
          </mesh>
          <mesh position={[0.03, 0.04, 0.15]}>
            <sphereGeometry args={[0.028, 12, 12]} />
            <meshStandardMaterial color={WHITE} emissive={WHITE} emissiveIntensity={0.4} />
          </mesh>
        </group>
      ))}

      {/* Rosy cheeks */}
      {[-0.34, 0.34].map((x) => (
        <mesh key={x} position={[x, 0.36, 0.46]} scale={[1, 0.7, 0.4]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color={CHEEK} roughness={0.7} transparent opacity={0.75} />
        </mesh>
      ))}

      {/* Little friendly moustache (barber signature) */}
      <mesh position={[0, 0.26, 0.52]} rotation={[0.1, 0, 0]}>
        <torusGeometry args={[0.13, 0.035, 10, 24, Math.PI]} />
        <meshStandardMaterial color={HAIR} roughness={0.8} />
      </mesh>
      {/* Smile just below */}
      <mesh position={[0, 0.18, 0.54]} rotation={[Math.PI, 0, 0]}>
        <torusGeometry args={[0.11, 0.02, 10, 24, Math.PI]} />
        <meshStandardMaterial color={'#7A4A38'} roughness={0.7} />
      </mesh>
    </group>
  );
}

export default function BarberFigure3D({ className = '' }) {
  const reduce = useReducedMotion();
  const [waving, setWaving] = useState(false);
  const timer = useRef(null);

  function poke() {
    setWaving(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setWaving(false), 2400);
  }

  const spin = !reduce && !waving;
  // While waving we need the render loop running even under reduced motion.
  const frameloop = !reduce || waving ? 'always' : 'demand';

  return (
    <div className={`relative ${className}`}>
      {/* Soft ivory halo lifts the character off the dark charcoal backdrop so
          the dark hair / oxblood shirt stay legible (contrast/accessibility). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 55% at 50% 44%, rgba(243,236,223,0.20), rgba(200,155,60,0.10) 45%, transparent 72%)',
        }}
      />

      {/* Speech bubble */}
      <AnimatePresence>
        {waving && (
          <motion.div
            key="hi"
            initial={{ opacity: 0, scale: 0.6, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 6 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 font-display text-ink"
            style={{
              background: '#F3ECDF',
              border: '2px solid #C89B3C',
              borderRadius: 12,
              padding: '2px 12px',
              fontSize: 24,
              lineHeight: 1.15,
              boxShadow: '0 6px 14px -6px rgba(0,0,0,0.6)',
            }}
          >
            Hi!
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                bottom: -7,
                left: '50%',
                marginLeft: -5,
                width: 10,
                height: 10,
                background: '#F3ECDF',
                borderRight: '2px solid #C89B3C',
                borderBottom: '2px solid #C89B3C',
                transform: 'rotate(45deg)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Canvas
        camera={{ position: [0, 0.15, 6.1], fov: 30 }}
        dpr={[1, 1.5]}
        frameloop={frameloop}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.95} color="#fff3da" />
        <directionalLight position={[3, 4, 3]} intensity={1.2} color="#ffe6ad" />
        <directionalLight position={[-3, 1.5, 2]} intensity={0.6} color="#ffe0bd" />
        {/* Bright brass rim from behind-top: crisp edge light so the silhouette
            separates cleanly from the charcoal background. */}
        <directionalLight position={[0, 3.5, -4]} intensity={1.1} color="#E7C56B" />
        {/* Gentle front fill to keep the face bright and readable. */}
        <pointLight position={[0, 1, 4.5]} intensity={0.5} color="#ffffff" />
        <Barber spin={spin} waving={waving} onPoke={poke} />
      </Canvas>
    </div>
  );
}
