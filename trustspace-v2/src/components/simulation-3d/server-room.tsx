"use client";

import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

// ─── Room Shell ──────────────────────────────────────────────────────────────

function Room({ alertLevel }: { alertLevel: "normal" | "warning" | "critical" }) {
  const floorColor = alertLevel === "critical" ? "#1a0a0a" : alertLevel === "warning" ? "#1a1508" : "#0a0f1a";
  const wallColor = alertLevel === "critical" ? "#1a0808" : "#0d1117";

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 18]} />
        <meshStandardMaterial color={floorColor} metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Floor grid */}
      {Array.from({ length: 13 }, (_, i) => (
        <mesh key={`gx-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[(i - 6) * 2, 0.001, 0]}>
          <planeGeometry args={[0.02, 18]} />
          <meshStandardMaterial color="#1a2332" />
        </mesh>
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={`gz-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, (i - 5) * 2]}>
          <planeGeometry args={[24, 0.02]} />
          <meshStandardMaterial color="#1a2332" />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, 0]}>
        <planeGeometry args={[24, 18]} />
        <meshStandardMaterial color="#080c12" />
      </mesh>
      <mesh position={[0, 2.5, -9]}>
        <planeGeometry args={[24, 5]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh position={[-12, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[18, 5]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh position={[12, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[18, 5]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
    </group>
  );
}

// ─── Server Rack ─────────────────────────────────────────────────────────────

function ServerRack({
  position, id, label, status, interactive, glowing, onSelect,
}: {
  position: [number, number, number];
  id: string;
  label: string;
  status: "healthy" | "warning" | "critical" | "offline";
  interactive: boolean;
  glowing: boolean;
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const lightRef = useRef<THREE.PointLight>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const statusColor = useMemo(() => ({
    healthy: "#00ff88", warning: "#ffaa00", critical: "#ff2222", offline: "#333333",
  }[status]), [status]);

  useFrame(({ clock }) => {
    if (lightRef.current) {
      if (status === "critical") lightRef.current.intensity = Math.sin(clock.elapsedTime * 5) > 0 ? 3 : 0.3;
      else if (status === "warning") lightRef.current.intensity = 1.5 + Math.sin(clock.elapsedTime * 2) * 0.5;
    }
    if (meshRef.current && glowing) {
      const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.02;
      meshRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group
      position={position}
      onClick={(e) => { if (!interactive) return; e.stopPropagation(); onSelect(id); }}
      onPointerOver={(e) => { if (!interactive) return; e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
    >
      <mesh ref={meshRef} position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[1.4, 3.2, 0.9]} />
        <meshStandardMaterial
          color={hovered ? "#3a4a5a" : "#1a2332"}
          metalness={0.7} roughness={0.2}
          emissive={glowing ? "#0044ff" : "#000000"}
          emissiveIntensity={glowing ? 0.15 : 0}
        />
      </mesh>
      <mesh position={[0, 1.6, 0.451]}>
        <boxGeometry args={[1.3, 3.0, 0.01]} />
        <meshStandardMaterial color="#0d1117" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Drive bays */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[0, 0.4 + i * 0.35, 0.46]}>
          <boxGeometry args={[1.1, 0.25, 0.01]} />
          <meshStandardMaterial color={status === "offline" ? "#0a0a0a" : "#111827"} />
        </mesh>
      ))}
      {/* Status LEDs */}
      {[0, 0.15, 0.3].map((offset, i) => (
        <mesh key={`led-${i}`} position={[0.55, 2.8 - offset, 0.46]}>
          <sphereGeometry args={[0.03]} />
          <meshStandardMaterial
            color={i === 0 ? statusColor : i === 1 ? (status === "healthy" ? "#00ff88" : "#333") : "#0088ff"}
            emissive={i === 0 ? statusColor : i === 1 ? (status === "healthy" ? "#00ff88" : "#333") : "#0088ff"}
            emissiveIntensity={status === "offline" ? 0.1 : 2}
          />
        </mesh>
      ))}
      <pointLight ref={lightRef} position={[0.6, 2.8, 0.8]} color={statusColor} intensity={status === "offline" ? 0 : 1.5} distance={3} />

      {/* HTML label */}
      {interactive && (
        <Html position={[0, 3.5, 0]} center style={{ pointerEvents: "none" }}>
          <div className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap animate-bounce ${hovered ? "bg-blue-600 text-white" : "bg-blue-900/80 text-blue-300"}`}>
            {hovered ? "Klicken!" : label}
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Emergency Button ────────────────────────────────────────────────────────

function EmergencyButton({
  position, interactive, onPress,
}: {
  position: [number, number, number];
  interactive: boolean;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <group
      position={position}
      onClick={(e) => { if (!interactive) return; e.stopPropagation(); onPress(); }}
      onPointerOver={(e) => { if (!interactive) return; e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
    >
      <mesh><boxGeometry args={[0.5, 0.5, 0.05]} /><meshStandardMaterial color="#333" metalness={0.5} roughness={0.3} /></mesh>
      <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.08, 16]} />
        <meshStandardMaterial color={hovered ? "#ff4444" : "#cc0000"} emissive="#ff0000" emissiveIntensity={hovered ? 0.8 : 0.3} />
      </mesh>
      {interactive && (
        <Html position={[0, 0.4, 0.05]} center style={{ pointerEvents: "none" }}>
          <div className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-900/80 text-red-300 whitespace-nowrap">NOT-AUS</div>
        </Html>
      )}
    </group>
  );
}

// ─── Monitor Station ─────────────────────────────────────────────────────────

function MonitorStation({
  position, screenContent, interactive, id, onSelect,
}: {
  position: [number, number, number];
  screenContent: "dashboard" | "alert" | "email" | "phone";
  interactive: boolean;
  id: string;
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const screenColor = { dashboard: "#001a33", alert: "#330000", email: "#001133", phone: "#0a1a0a" }[screenContent];
  const emissiveColor = { dashboard: "#003366", alert: "#660000", email: "#002266", phone: "#006600" }[screenContent];
  const screenLabel = { dashboard: "MONITORING", alert: "ALARM", email: "E-MAIL", phone: "TELEFON" }[screenContent];

  return (
    <group
      position={position}
      onClick={(e) => { if (!interactive) return; e.stopPropagation(); onSelect(id); }}
      onPointerOver={(e) => { if (!interactive) return; e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
    >
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[2.2, 0.06, 1]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.4} />
      </mesh>
      {[[-1, 0.375, -0.4], [1, 0.375, -0.4], [-1, 0.375, 0.4], [1, 0.375, 0.4]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[0.04, 0.75, 0.04]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      <mesh position={[0, 1.3, -0.3]}>
        <boxGeometry args={[1.2, 0.7, 0.04]} />
        <meshStandardMaterial color={screenColor} emissive={emissiveColor} emissiveIntensity={hovered ? 1.5 : 0.8} />
      </mesh>
      <mesh position={[0, 1.3, -0.31]}>
        <boxGeometry args={[1.3, 0.8, 0.02]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 0.95, -0.3]}>
        <boxGeometry args={[0.08, 0.35, 0.08]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, 0.79, 0.15]}>
        <boxGeometry args={[0.8, 0.02, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {interactive && (
        <Html position={[0, 1.9, -0.3]} center style={{ pointerEvents: "none" }}>
          <div className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap animate-bounce ${hovered ? "bg-blue-600 text-white" : "bg-blue-900/80 text-blue-300"}`}>
            {hovered ? "Klicken!" : screenLabel}
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Warning Light ───────────────────────────────────────────────────────────

function WarningLight({ position, active }: { position: [number, number, number]; active: boolean }) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => { if (ref.current && active) ref.current.intensity = Math.sin(clock.elapsedTime * 4) > 0 ? 8 : 0; });

  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.03, 0.03, 3, 8]} /><meshStandardMaterial color="#333" /></mesh>
      <mesh position={[0, 3.1, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.15, 16]} />
        <meshStandardMaterial color={active ? "#ff0000" : "#330000"} emissive={active ? "#ff0000" : "#000"} emissiveIntensity={active ? 2 : 0} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 2.9, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.15, 16]} />
        <meshStandardMaterial color={active ? "#ffaa00" : "#332200"} emissive={active ? "#ffaa00" : "#000"} emissiveIntensity={active ? 1 : 0} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 2.7, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.15, 16]} />
        <meshStandardMaterial color="#003300" emissive={active ? "#000" : "#00ff00"} emissiveIntensity={active ? 0 : 0.5} transparent opacity={0.9} />
      </mesh>
      {active && <pointLight ref={ref} position={[0, 3.2, 0]} color="#ff0000" intensity={5} distance={8} />}
    </group>
  );
}

// ─── Network Cabinet ─────────────────────────────────────────────────────────

function NetworkCabinet({
  position, interactive, id, onSelect,
}: {
  position: [number, number, number];
  interactive: boolean;
  id: string;
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <group
      position={position}
      onClick={(e) => { if (!interactive) return; e.stopPropagation(); onSelect(id); }}
      onPointerOver={(e) => { if (!interactive) return; e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
    >
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[0.8, 2, 0.6]} />
        <meshStandardMaterial color={hovered ? "#2a3a4a" : "#1a2332"} metalness={0.6} roughness={0.3} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[-0.2 + i * 0.08, 1.5, 0.31]}>
          <cylinderGeometry args={[0.015, 0.015, 0.4, 6]} />
          <meshStandardMaterial
            color={["#0066ff", "#00cc44", "#ffaa00", "#ff4444", "#0066ff", "#00cc44"][i]}
            emissive={["#0033aa", "#006622", "#885500", "#882222", "#0033aa", "#006622"][i]}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
      {interactive && (
        <Html position={[0, 2.3, 0]} center style={{ pointerEvents: "none" }}>
          <div className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap animate-bounce ${hovered ? "bg-blue-600 text-white" : "bg-blue-900/80 text-blue-300"}`}>
            {hovered ? "Klicken!" : "NETZWERK"}
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── FIRE: Smoke Particles ───────────────────────────────────────────────────

function SmokeCloud({ position, intensity }: { position: [number, number, number]; intensity: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.5) * 0.3;
      ref.current.rotation.y = clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={ref} position={position}>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[(Math.random() - 0.5) * 2, Math.random() * 1.5, (Math.random() - 0.5) * 2]}>
          <sphereGeometry args={[0.4 + Math.random() * 0.6, 8, 8]} />
          <meshStandardMaterial color="#444" transparent opacity={0.15 * intensity} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function FireGlow({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.intensity = 6 + Math.sin(clock.elapsedTime * 8) * 3 + Math.random() * 2;
    }
  });

  return (
    <group position={position}>
      {/* Glowing embers on floor */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.8, 16]} />
        <meshStandardMaterial color="#ff2200" emissive="#ff4400" emissiveIntensity={2} transparent opacity={0.4} />
      </mesh>
      <pointLight ref={ref} position={[0, 0.5, 0]} color="#ff4400" intensity={6} distance={5} />
    </group>
  );
}

function FireSuppressionNozzle({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh><cylinderGeometry args={[0.06, 0.08, 0.1, 12]} /><meshStandardMaterial color="#cc0000" metalness={0.8} roughness={0.2} /></mesh>
      <mesh position={[0, -0.08, 0]}><cylinderGeometry args={[0.03, 0.06, 0.05, 12]} /><meshStandardMaterial color="#888" metalness={0.9} /></mesh>
    </group>
  );
}

function GasCylinder({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.8, 0]}><cylinderGeometry args={[0.15, 0.15, 1.6, 12]} /><meshStandardMaterial color="#cc0000" metalness={0.4} roughness={0.3} /></mesh>
      <mesh position={[0, 1.65, 0]}><cylinderGeometry args={[0.08, 0.15, 0.1, 12]} /><meshStandardMaterial color="#444" metalness={0.8} /></mesh>
      {/* Pressure gauge */}
      <mesh position={[0.16, 1.5, 0]}><sphereGeometry args={[0.04]} /><meshStandardMaterial color="#eee" /></mesh>
    </group>
  );
}

// ─── RANSOMWARE: Lock/Skull Screen Effects ───────────────────────────────────

function RansomScreen({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.5 + Math.sin(clock.elapsedTime * 2) * 0.5;
    }
  });

  return (
    <group position={position}>
      {/* Floating lock screen */}
      <mesh ref={ref} position={[0, 2, 0.5]}>
        <planeGeometry args={[1.0, 0.6]} />
        <meshStandardMaterial color="#220000" emissive="#ff0000" emissiveIntensity={1.5} transparent opacity={0.9} />
      </mesh>
      {/* Lock icon (box shape) */}
      <mesh position={[0, 2.1, 0.52]}>
        <boxGeometry args={[0.15, 0.15, 0.02]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff3300" emissiveIntensity={3} />
      </mesh>
      {/* Lock shackle (torus) */}
      <mesh position={[0, 2.2, 0.52]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.06, 0.02, 8, 12, Math.PI]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff3300" emissiveIntensity={3} />
      </mesh>
    </group>
  );
}

function EncryptedFileCube({ position, delay }: { position: [number, number, number]; delay: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.x = clock.elapsedTime + delay;
      ref.current.rotation.y = clock.elapsedTime * 0.7 + delay;
      ref.current.position.y = position[1] + Math.sin(clock.elapsedTime + delay) * 0.2;
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[0.15, 0.15, 0.15]} />
      <meshStandardMaterial color="#ff0044" emissive="#ff0022" emissiveIntensity={2} wireframe />
    </mesh>
  );
}

function BitcoinSymbol({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.5;
  });

  return (
    <group ref={ref} position={position}>
      <mesh><torusGeometry args={[0.3, 0.05, 8, 24]} /><meshStandardMaterial color="#f7931a" emissive="#f7931a" emissiveIntensity={2} /></mesh>
      <mesh><boxGeometry args={[0.08, 0.5, 0.05]} /><meshStandardMaterial color="#f7931a" emissive="#f7931a" emissiveIntensity={2} /></mesh>
      <mesh><boxGeometry args={[0.3, 0.08, 0.05]} /><meshStandardMaterial color="#f7931a" emissive="#f7931a" emissiveIntensity={2} /></mesh>
    </group>
  );
}

// ─── DATA BREACH: Forensic / Data Flow Elements ─────────────────────────────

function DataStream({ startPos, endPos, color }: { startPos: [number, number, number]; endPos: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Group>(null);
  const particles = 8;

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.children.forEach((child, i) => {
        const t = ((clock.elapsedTime * 0.5 + i / particles) % 1);
        child.position.set(
          startPos[0] + (endPos[0] - startPos[0]) * t,
          startPos[1] + (endPos[1] - startPos[1]) * t + Math.sin(t * Math.PI) * 0.3,
          startPos[2] + (endPos[2] - startPos[2]) * t
        );
      });
    }
  });

  return (
    <group ref={ref}>
      {Array.from({ length: particles }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.04]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
        </mesh>
      ))}
    </group>
  );
}

function ForensicScanner({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = 0.5 + Math.sin(clock.elapsedTime) * 2;
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.15 + Math.sin(clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Scanning plane that moves up and down */}
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial color="#2244ff" emissive="#2244ff" emissiveIntensity={1} transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function MagnifyingGlass({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.x = position[0] + Math.sin(clock.elapsedTime * 0.3) * 2;
      ref.current.position.z = position[2] + Math.cos(clock.elapsedTime * 0.3) * 2;
      ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh><torusGeometry args={[0.25, 0.03, 8, 24]} /><meshStandardMaterial color="#4488ff" emissive="#2266ff" emissiveIntensity={1.5} /></mesh>
      <mesh position={[0.2, -0.2, 0]} rotation={[0, 0, -0.7]}><cylinderGeometry args={[0.02, 0.03, 0.3, 8]} /><meshStandardMaterial color="#666" metalness={0.8} /></mesh>
      {/* Lens glow */}
      <pointLight position={[0, 0, 0.1]} color="#4488ff" intensity={2} distance={3} />
    </group>
  );
}

// ─── Ceiling Light ───────────────────────────────────────────────────────────

function CeilingLight({ position, flickering }: { position: [number, number, number]; flickering: boolean }) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (ref.current && flickering) ref.current.intensity = 15 + Math.random() * 20 * (Math.sin(clock.elapsedTime * 12) > 0.3 ? 1 : 0.1);
  });

  return (
    <group position={position}>
      <mesh><boxGeometry args={[1.8, 0.06, 0.4]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={flickering ? 0.3 : 0.8} /></mesh>
      <pointLight ref={ref} intensity={flickering ? 10 : 25} distance={12} color={flickering ? "#ffccaa" : "#e8ecff"} position={[0, -0.1, 0]} />
    </group>
  );
}

// ─── Fire Extinguisher ───────────────────────────────────────────────────────

function FireExtinguisher({ position, interactive, onSelect }: { position: [number, number, number]; interactive: boolean; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <group
      position={position}
      onClick={(e) => { if (!interactive) return; e.stopPropagation(); onSelect(); }}
      onPointerOver={(e) => { if (!interactive) return; e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
    >
      <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.12, 0.12, 0.8, 16]} /><meshStandardMaterial color={hovered ? "#ff3333" : "#cc0000"} metalness={0.4} roughness={0.3} /></mesh>
      <mesh position={[0, 1.05, 0]}><cylinderGeometry args={[0.06, 0.12, 0.1, 16]} /><meshStandardMaterial color="#222" metalness={0.7} /></mesh>
    </group>
  );
}

// ─── Exported Scene ──────────────────────────────────────────────────────────

export interface ServerRoomProps {
  alertLevel: "normal" | "warning" | "critical";
  interactiveObjects: string[];
  serverStatuses: Record<string, "healthy" | "warning" | "critical" | "offline">;
  onObjectSelect: (objectId: string) => void;
  scenarioCategory?: string;
}

export default function ServerRoomScene({ alertLevel, interactiveObjects, serverStatuses, onObjectSelect, scenarioCategory = "operational" }: ServerRoomProps) {
  const isAlarm = alertLevel === "critical" || alertLevel === "warning";

  // Scenario-specific atmosphere
  const bgColor = scenarioCategory === "physical" ? (isAlarm ? "#100500" : "#050810") :
                   scenarioCategory === "cyber" ? (isAlarm ? "#0a0004" : "#050810") :
                   scenarioCategory === "data" ? "#06050f" : "#050810";

  const fogColor = scenarioCategory === "physical" ? (isAlarm ? "#100500" : "#050810") :
                   scenarioCategory === "cyber" ? "#08000a" : "#050810";

  const ambientIntensity = scenarioCategory === "physical" ? (isAlarm ? 0.04 : 0.12) :
                           scenarioCategory === "cyber" ? (isAlarm ? 0.06 : 0.12) :
                           isAlarm ? 0.08 : 0.15;

  // Fire scenario gets warm directional light
  const dirLightColor = scenarioCategory === "physical" && isAlarm ? "#ff8844" : "#ffffff";
  const dirLightIntensity = scenarioCategory === "physical" && isAlarm ? 0.15 : (isAlarm ? 0.3 : 0.6);

  return (
    <Canvas
      shadows
      camera={{ position: [10, 7, 14], fov: 50 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      style={{ background: bgColor }}
    >
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[fogColor, 18, 40]} />
      <ambientLight intensity={ambientIntensity} />
      <directionalLight position={[5, 8, 3]} intensity={dirLightIntensity} color={dirLightColor} castShadow shadow-mapSize={[1024, 1024]} />

      {/* Fire scenario: warm glow from below */}
      {scenarioCategory === "physical" && isAlarm && (
        <>
          <pointLight position={[-4, 0.5, -7]} color="#ff4400" intensity={8} distance={6} />
          <pointLight position={[-3, 1, -6]} color="#ff6600" intensity={4} distance={4} />
        </>
      )}

      {/* Ransomware scenario: eerie purple/red glow */}
      {scenarioCategory === "cyber" && isAlarm && (
        <>
          <pointLight position={[0, 2, -5]} color="#aa0033" intensity={3} distance={10} />
          <pointLight position={[-5, 1, 0]} color="#6600aa" intensity={2} distance={8} />
        </>
      )}

      {/* Data breach: cold blue forensic light */}
      {scenarioCategory === "data" && (
        <pointLight position={[0, 3, 0]} color="#2244ff" intensity={2} distance={12} />
      )}

      <Room alertLevel={alertLevel} />

      {/* Server Racks Row 1 */}
      {[
        { pos: [-6, 0, -7] as [number, number, number], id: "srv-db", label: "DB-PRIMARY" },
        { pos: [-4, 0, -7] as [number, number, number], id: "srv-app", label: "APP-SERVER" },
        { pos: [-2, 0, -7] as [number, number, number], id: "srv-web", label: "WEB-SERVER" },
        { pos: [0, 0, -7] as [number, number, number], id: "srv-mail", label: "MAIL" },
      ].map((s) => (
        <ServerRack key={s.id} position={s.pos} id={s.id} label={s.label} status={serverStatuses[s.id] ?? "healthy"} interactive={interactiveObjects.includes(s.id)} glowing={interactiveObjects.includes(s.id)} onSelect={onObjectSelect} />
      ))}

      {/* Server Racks Row 2 */}
      {[
        { pos: [3, 0, -7] as [number, number, number], id: "srv-backup", label: "BACKUP" },
        { pos: [5, 0, -7] as [number, number, number], id: "srv-monitor", label: "MONITORING" },
        { pos: [7, 0, -7] as [number, number, number], id: "srv-firewall", label: "FIREWALL" },
      ].map((s) => (
        <ServerRack key={s.id} position={s.pos} id={s.id} label={s.label} status={serverStatuses[s.id] ?? "healthy"} interactive={interactiveObjects.includes(s.id)} glowing={interactiveObjects.includes(s.id)} onSelect={onObjectSelect} />
      ))}

      {/* Workstations */}
      <MonitorStation position={[-7, 0, 3]} screenContent={isAlarm ? "alert" : "dashboard"} interactive={interactiveObjects.includes("monitor-main")} id="monitor-main" onSelect={onObjectSelect} />
      <MonitorStation position={[-3, 0, 3]} screenContent="email" interactive={interactiveObjects.includes("monitor-email")} id="monitor-email" onSelect={onObjectSelect} />
      <MonitorStation position={[1, 0, 3]} screenContent="phone" interactive={interactiveObjects.includes("monitor-phone")} id="monitor-phone" onSelect={onObjectSelect} />

      <NetworkCabinet position={[9, 0, -3]} interactive={interactiveObjects.includes("network-switch")} id="network-switch" onSelect={onObjectSelect} />

      <group position={[-11.95, 1.5, -3]} rotation={[0, Math.PI / 2, 0]}>
        <EmergencyButton position={[0, 0, 0]} interactive={interactiveObjects.includes("emergency-stop")} onPress={() => onObjectSelect("emergency-stop")} />
      </group>

      <FireExtinguisher position={[-11.5, 0, 2]} interactive={interactiveObjects.includes("fire-extinguisher")} onSelect={() => onObjectSelect("fire-extinguisher")} />

      <WarningLight position={[-10, 0, -7]} active={isAlarm} />
      <WarningLight position={[10, 0, -7]} active={isAlarm} />

      <CeilingLight position={[-5, 4.9, -4]} flickering={alertLevel === "critical"} />
      <CeilingLight position={[3, 4.9, -4]} flickering={alertLevel === "critical"} />
      <CeilingLight position={[-5, 4.9, 3]} flickering={false} />
      <CeilingLight position={[3, 4.9, 3]} flickering={false} />

      {/* ═══ FIRE SCENARIO: Smoke, flames, suppression systems ═══ */}
      {scenarioCategory === "physical" && (
        <>
          {/* Fire suppression nozzles on ceiling */}
          <FireSuppressionNozzle position={[-4, 4.85, -5]} />
          <FireSuppressionNozzle position={[0, 4.85, -5]} />
          <FireSuppressionNozzle position={[4, 4.85, -5]} />
          <FireSuppressionNozzle position={[-4, 4.85, 1]} />
          <FireSuppressionNozzle position={[4, 4.85, 1]} />

          {/* Gas cylinders (FM-200) along back wall */}
          <GasCylinder position={[9, 0, -7]} />
          <GasCylinder position={[9.5, 0, -7]} />
          <GasCylinder position={[10, 0, -7]} />

          {/* Fire effects when alarm active */}
          {isAlarm && (
            <>
              <FireGlow position={[-4, 0, -6.5]} />
              <FireGlow position={[-3.5, 0, -7]} />
              <SmokeCloud position={[-4, 3, -6]} intensity={1} />
              <SmokeCloud position={[-3, 3.5, -7]} intensity={0.8} />
              <SmokeCloud position={[-5, 2.5, -5]} intensity={0.5} />
              {/* Extra warm lights */}
              <pointLight position={[-4, 2, -6]} color="#ff2200" intensity={10} distance={5} />
            </>
          )}
        </>
      )}

      {/* ═══ RANSOMWARE SCENARIO: Encrypted screens, lock icons, Bitcoin ═══ */}
      {scenarioCategory === "cyber" && (
        <>
          {/* Ransom screens floating above infected servers */}
          {isAlarm && (
            <>
              <RansomScreen position={[-6, 0, -7]} />
              <RansomScreen position={[-4, 0, -7]} />
              <RansomScreen position={[-2, 0, -7]} />

              {/* Encrypted file cubes floating around */}
              <EncryptedFileCube position={[-5, 3, -4]} delay={0} />
              <EncryptedFileCube position={[-3, 2.5, -3]} delay={1} />
              <EncryptedFileCube position={[-1, 3.5, -5]} delay={2} />
              <EncryptedFileCube position={[1, 2.8, -4]} delay={3} />
              <EncryptedFileCube position={[-6, 3.2, -2]} delay={4} />
              <EncryptedFileCube position={[3, 3, -6]} delay={5} />

              {/* Bitcoin symbol floating (ransom demand) */}
              <BitcoinSymbol position={[0, 4, -3]} />
            </>
          )}
        </>
      )}

      {/* ═══ DATA BREACH SCENARIO: Data streams, forensic scanner, magnifier ═══ */}
      {scenarioCategory === "data" && (
        <>
          {/* Data exfiltration streams (red = leaked data flowing out) */}
          {isAlarm && (
            <>
              <DataStream startPos={[-6, 1.5, -7]} endPos={[9, 2, -3]} color="#ff0044" />
              <DataStream startPos={[-4, 1.5, -7]} endPos={[9, 1.5, -3]} color="#ff0066" />
              <DataStream startPos={[-6, 2, -7]} endPos={[12, 2.5, 0]} color="#ff0044" />
            </>
          )}

          {/* Internal safe data streams (blue) */}
          <DataStream startPos={[-6, 1, -7]} endPos={[3, 1, -7]} color="#0066ff" />
          <DataStream startPos={[-7, 1.3, 3]} endPos={[-3, 1.3, 3]} color="#0044cc" />

          {/* Forensic scanning plane over DB server */}
          <ForensicScanner position={[-6, 0, -7]} />

          {/* Magnifying glass floating around (investigation) */}
          <MagnifyingGlass position={[-4, 2.5, -5]} />

          {/* DSGVO countdown hologram */}
          {isAlarm && (
            <group position={[5, 3.5, 3]}>
              <mesh><boxGeometry args={[2, 0.8, 0.05]} /><meshStandardMaterial color="#1a001a" emissive="#660066" emissiveIntensity={0.5} transparent opacity={0.7} /></mesh>
              <pointLight position={[0, 0, 0.5]} color="#9933ff" intensity={3} distance={4} />
            </group>
          )}
        </>
      )}

      <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.1} minPolarAngle={0.3} minDistance={5} maxDistance={22} target={[0, 1.5, -2]} enableDamping dampingFactor={0.05} />
    </Canvas>
  );
}
