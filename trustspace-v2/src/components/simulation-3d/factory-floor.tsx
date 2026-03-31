"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

// ─── Label Map for IDs ───────────────────────────────────────────────────────

const LABEL_MAP: Record<string, string> = {
  "srv-db": "MASCHINE 1",
  "srv-app": "MASCHINE 2",
  "srv-web": "ANLAGE B",
  "srv-monitor": "BEDIENFELD",
  "srv-mail": "STEUERUNG",
  "srv-backup": "SCHALTSCHRANK",
  "srv-firewall": "SICHERUNG",
  "monitor-main": "LEITSTAND",
  "monitor-email": "MEISTERBÜRO",
  "monitor-phone": "TELEFON",
  "network-switch": "STROMVERTEILER",
  "emergency-stop": "NOT-HALT",
};

// ─── Simple Human Figure ─────────────────────────────────────────────────────

function PersonFigure({ position, color = "#3366aa", helmetColor = "#dddd00", animated = false, onGround = false }: {
  position: [number, number, number]; color?: string; helmetColor?: string; animated?: boolean; onGround?: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current && animated) {
      // Slight idle sway
      ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.5 + position[0]) * 0.1;
      ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 2) * 0.02;
    }
  });

  if (onGround) {
    // Person lying on the ground (injury scene)
    return (
      <group position={position}>
        {/* Body horizontal */}
        <mesh position={[0, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.12, 0.6, 4, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {/* Head */}
        <mesh position={[0.5, 0.15, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#f0c8a0" />
        </mesh>
        {/* Helmet */}
        <mesh position={[0.5, 0.22, 0]}>
          <sphereGeometry args={[0.13, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={helmetColor} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={ref} position={position}>
      {/* Legs */}
      <mesh position={[-0.06, 0.35, 0]}><capsuleGeometry args={[0.05, 0.4, 4, 8]} /><meshStandardMaterial color="#2a2a3a" /></mesh>
      <mesh position={[0.06, 0.35, 0]}><capsuleGeometry args={[0.05, 0.4, 4, 8]} /><meshStandardMaterial color="#2a2a3a" /></mesh>
      {/* Body / Torso */}
      <mesh position={[0, 0.85, 0]}>
        <capsuleGeometry args={[0.13, 0.35, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.2, 0.85, 0]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.04, 0.35, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.2, 0.85, 0]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.04, 0.35, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#f0c8a0" />
      </mesh>
      {/* Safety Helmet */}
      <mesh position={[0, 1.28, 0]}>
        <sphereGeometry args={[0.12, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={helmetColor} />
      </mesh>
    </group>
  );
}

// ─── Pulsing Glow Ring (marks interactive objects) ───────────────────────────

function InteractiveGlow({ position, radius = 1.2, color = "#00aaff" }: { position: [number, number, number]; radius?: number; color?: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const scale = 1 + Math.sin(clock.elapsedTime * 2) * 0.15;
      ref.current.scale.set(scale, scale, scale);
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.3 + Math.sin(clock.elapsedTime * 3) * 0.15;
    }
  });
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.8, radius, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

function InteractiveArrow({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 3) * 0.3;
    }
  });
  return (
    <group ref={ref} position={position}>
      <mesh rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.15, 0.4, 8]} />
        <meshStandardMaterial color="#00ccff" emissive="#00ccff" emissiveIntensity={4} />
      </mesh>
      <pointLight color="#00ccff" intensity={4} distance={5} />
    </group>
  );
}

// ─── Factory Hall ────────────────────────────────────────────────────────────

function FactoryHall({ isAlarm }: { isAlarm: boolean }) {
  return (
    <group>
      {/* Concrete floor - light grey */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color="#888880" metalness={0.05} roughness={0.95} />
      </mesh>
      {/* Yellow safety lanes */}
      {[-7.5, -2.5, 2.5, 7.5].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.003, 0]}>
          <planeGeometry args={[0.12, 20]} />
          <meshStandardMaterial color="#ddaa00" />
        </mesh>
      ))}
      {/* Cross lanes */}
      {[-5, 0, 5].map((z, i) => (
        <mesh key={`z-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, z]}>
          <planeGeometry args={[30, 0.12]} />
          <meshStandardMaterial color="#ddaa00" />
        </mesh>
      ))}
      {/* Walls - industrial grey-green */}
      <mesh position={[0, 4, -10]}><planeGeometry args={[30, 8]} /><meshStandardMaterial color="#667766" /></mesh>
      <mesh position={[-15, 4, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[20, 8]} /><meshStandardMaterial color="#606860" /></mesh>
      <mesh position={[15, 4, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[20, 8]} /><meshStandardMaterial color="#606860" /></mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 8, 0]}><planeGeometry args={[30, 20]} /><meshStandardMaterial color="#445544" /></mesh>
      {/* Steel beams across ceiling */}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[0, 7.6, (i - 2) * 5]}>
          <boxGeometry args={[30, 0.4, 0.2]} />
          <meshStandardMaterial color="#778877" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Vertical pillars */}
      {[[-12, -8], [-12, 0], [-12, 8], [12, -8], [12, 0], [12, 8]].map(([x, z], i) => (
        <mesh key={i} position={[x, 4, z]}>
          <boxGeometry args={[0.3, 8, 0.3]} />
          <meshStandardMaterial color="#888" metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Conveyor Belt ───────────────────────────────────────────────────────────

function ConveyorBelt({ position, length, running }: { position: [number, number, number]; length: number; running: boolean }) {
  return (
    <group position={position}>
      {/* Frame - steel blue */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[length, 0.12, 1.4]} />
        <meshStandardMaterial color="#5577aa" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Belt surface - dark rubber */}
      <mesh position={[0, 0.92, 0]}>
        <boxGeometry args={[length - 0.2, 0.03, 1.15]} />
        <meshStandardMaterial color={running ? "#333" : "#1a1a1a"} />
      </mesh>
      {/* Side rails */}
      <mesh position={[0, 1.0, 0.65]}><boxGeometry args={[length, 0.15, 0.03]} /><meshStandardMaterial color="#6688aa" metalness={0.7} /></mesh>
      <mesh position={[0, 1.0, -0.65]}><boxGeometry args={[length, 0.15, 0.03]} /><meshStandardMaterial color="#6688aa" metalness={0.7} /></mesh>
      {/* Legs */}
      {[-(length / 2 - 0.3), 0, length / 2 - 0.3].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.42, -0.55]}><boxGeometry args={[0.08, 0.85, 0.08]} /><meshStandardMaterial color="#666" metalness={0.8} /></mesh>
          <mesh position={[x, 0.42, 0.55]}><boxGeometry args={[0.08, 0.85, 0.08]} /><meshStandardMaterial color="#666" metalness={0.8} /></mesh>
        </group>
      ))}
      {/* Products on belt (boxes) */}
      {running && Array.from({ length: 3 }, (_, i) => (
        <mesh key={i} position={[-(length / 3) + i * (length / 3), 1.1, 0]}>
          <boxGeometry args={[0.5, 0.4, 0.5]} />
          <meshStandardMaterial color="#bb8844" />
        </mesh>
      ))}
      {/* Status light on end */}
      <mesh position={[length / 2 + 0.15, 1.3, 0]}>
        <sphereGeometry args={[0.08]} />
        <meshStandardMaterial color={running ? "#00ff44" : "#ff0000"} emissive={running ? "#00ff44" : "#ff0000"} emissiveIntensity={2} />
      </mesh>
      <pointLight position={[length / 2 + 0.15, 1.3, 0]} color={running ? "#00ff44" : "#ff0000"} intensity={2} distance={3} />
    </group>
  );
}

// ─── Robot Arm ───────────────────────────────────────────────────────────────

function RobotArm({ position, active, interactive, id, onSelect }: {
  position: [number, number, number]; active: boolean; interactive: boolean; id: string; onSelect: (id: string) => void;
}) {
  const armRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (armRef.current && active) {
      armRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.8;
    }
  });

  const label = LABEL_MAP[id] ?? id;

  return (
    <group
      position={position}
      onClick={(e) => { if (!interactive) return; e.stopPropagation(); onSelect(id); }}
      onPointerOver={(e) => { if (!interactive) return; e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
    >
      {/* Heavy base plate */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.6, 0.65, 0.2, 16]} />
        <meshStandardMaterial color={hovered ? "#777" : "#555"} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Turntable */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.1, 16]} />
        <meshStandardMaterial color={active ? "#ff8800" : "#885500"} metalness={0.6} />
      </mesh>
      {/* Arm assembly */}
      <group ref={armRef} position={[0, 0.3, 0]}>
        {/* Lower arm */}
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[0.2, 1.4, 0.2]} />
          <meshStandardMaterial color={active ? "#ff9922" : "#664400"} metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Joint */}
        <mesh position={[0, 1.4, 0]}>
          <sphereGeometry args={[0.15]} />
          <meshStandardMaterial color="#444" metalness={0.9} />
        </mesh>
        {/* Upper arm */}
        <mesh position={[0.2, 1.7, 0]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[0.15, 0.9, 0.15]} />
          <meshStandardMaterial color={active ? "#ff9922" : "#664400"} metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Gripper */}
        <mesh position={[0.55, 2.0, 0]}>
          <boxGeometry args={[0.25, 0.08, 0.15]} />
          <meshStandardMaterial color="#333" metalness={0.9} />
        </mesh>
        <mesh position={[0.48, 1.95, -0.06]}><boxGeometry args={[0.04, 0.15, 0.04]} /><meshStandardMaterial color="#333" metalness={0.9} /></mesh>
        <mesh position={[0.48, 1.95, 0.06]}><boxGeometry args={[0.04, 0.15, 0.04]} /><meshStandardMaterial color="#333" metalness={0.9} /></mesh>
      </group>
      {/* Warning stripe at base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[0.7, 0.85, 16]} />
        <meshStandardMaterial color="#ddaa00" />
      </mesh>

      {/* Status + glow */}
      <pointLight position={[0, 1, 0.5]} color={active ? "#ff8800" : "#ff0000"} intensity={active ? 2 : 5} distance={4} />

      {interactive && (
        <Html position={[0, 3, 0]} center style={{ pointerEvents: "none" }}>
          <div className={`text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg ${
            hovered ? "bg-orange-500 text-white scale-110" : "bg-orange-900/90 text-orange-200 animate-bounce"
          }`}>
            {hovered ? "▶ Klicken!" : label}
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── HMI Panel ───────────────────────────────────────────────────────────────

function HMIPanel({ position, status, interactive, id, onSelect }: {
  position: [number, number, number]; status: "ok" | "warning" | "error"; interactive: boolean; id: string; onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const screenEmissive = status === "error" ? "#ff0000" : status === "warning" ? "#ffaa00" : "#00ff44";
  const label = LABEL_MAP[id] ?? id;

  return (
    <group
      position={position}
      onClick={(e) => { if (!interactive) return; e.stopPropagation(); onSelect(id); }}
      onPointerOver={(e) => { if (!interactive) return; e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
    >
      {/* Stand */}
      <mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.05, 0.08, 1.4, 8]} /><meshStandardMaterial color="#666" metalness={0.8} /></mesh>
      {/* Base plate */}
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.3, 0.3, 0.04, 12]} /><meshStandardMaterial color="#555" metalness={0.7} /></mesh>
      {/* Screen housing */}
      <mesh position={[0, 1.5, 0]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.7, 0.55, 0.06]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.4} />
      </mesh>
      {/* Screen - bright! */}
      <mesh position={[0, 1.5, 0.035]} rotation={[-0.3, 0, 0]}>
        <planeGeometry args={[0.62, 0.47]} />
        <meshStandardMaterial color="#111" emissive={screenEmissive} emissiveIntensity={hovered ? 2 : 1.2} />
      </mesh>
      <pointLight position={[0, 1.5, 0.3]} color={screenEmissive} intensity={2} distance={3} />

      {interactive && (
        <Html position={[0, 2.2, 0]} center style={{ pointerEvents: "none" }}>
          <div className={`text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg ${
            hovered ? "bg-blue-500 text-white scale-110" : "bg-blue-900/90 text-blue-200 animate-bounce"
          }`}>
            {hovered ? "▶ Klicken!" : label}
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Stack Light (Traffic light) ─────────────────────────────────────────────

function StackLight({ position, status }: { position: [number, number, number]; status: "ok" | "warning" | "error" }) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (ref.current && status === "error") ref.current.intensity = Math.sin(clock.elapsedTime * 4) > 0 ? 8 : 0.5;
  });

  return (
    <group position={position}>
      <mesh position={[0, 2, 0]}><cylinderGeometry args={[0.03, 0.03, 4, 6]} /><meshStandardMaterial color="#888" metalness={0.8} /></mesh>
      {/* Red */}
      <mesh position={[0, 4.3, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.15, 12]} />
        <meshStandardMaterial color={status === "error" ? "#ff0000" : "#441111"} emissive={status === "error" ? "#ff0000" : "#000"} emissiveIntensity={status === "error" ? 4 : 0} transparent opacity={0.95} />
      </mesh>
      {/* Amber */}
      <mesh position={[0, 4.1, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.15, 12]} />
        <meshStandardMaterial color={status === "warning" ? "#ffaa00" : "#443311"} emissive={status === "warning" ? "#ffaa00" : "#000"} emissiveIntensity={status === "warning" ? 3 : 0} transparent opacity={0.95} />
      </mesh>
      {/* Green */}
      <mesh position={[0, 3.9, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.15, 12]} />
        <meshStandardMaterial color={status === "ok" ? "#00ff44" : "#114411"} emissive={status === "ok" ? "#00ff44" : "#000"} emissiveIntensity={status === "ok" ? 2 : 0} transparent opacity={0.95} />
      </mesh>
      {status === "error" && <pointLight ref={ref} position={[0, 4.5, 0]} color="#ff0000" intensity={6} distance={8} />}
    </group>
  );
}

// ─── Control Room (Leitstand) ────────────────────────────────────────────────

function ControlRoom({ position, interactive, id, onSelect }: {
  position: [number, number, number]; interactive: boolean; id: string; onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <group
      position={position}
      onClick={(e) => { if (!interactive) return; e.stopPropagation(); onSelect(id); }}
      onPointerOver={(e) => { if (!interactive) return; e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
    >
      {/* Elevated platform */}
      <mesh position={[0, 0.15, 0]}><boxGeometry args={[4, 0.3, 2.5]} /><meshStandardMaterial color="#555" metalness={0.3} /></mesh>
      {/* Desk */}
      <mesh position={[0, 0.95, -0.3]} castShadow><boxGeometry args={[3.5, 0.07, 1]} /><meshStandardMaterial color="#4a4a48" metalness={0.4} /></mesh>
      {/* 3 Monitors - bright screens */}
      {[-1, 0, 1].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 1.35, -0.65]}><boxGeometry args={[0.85, 0.55, 0.04]} /><meshStandardMaterial color="#111" emissive={hovered ? "#0066ff" : "#003388"} emissiveIntensity={hovered ? 2 : 1} /></mesh>
          <mesh position={[x, 1.35, -0.67]}><boxGeometry args={[0.9, 0.6, 0.02]} /><meshStandardMaterial color="#222" /></mesh>
          <mesh position={[x, 1.05, -0.65]}><boxGeometry args={[0.06, 0.25, 0.06]} /><meshStandardMaterial color="#333" /></mesh>
        </group>
      ))}
      {/* Screen glow */}
      <pointLight position={[0, 1.4, 0]} color="#3366ff" intensity={3} distance={4} />
      {/* Chair */}
      <mesh position={[0, 0.6, 0.5]}><boxGeometry args={[0.55, 0.06, 0.55]} /><meshStandardMaterial color="#222" /></mesh>
      <mesh position={[0, 0.9, 0.75]}><boxGeometry args={[0.55, 0.5, 0.06]} /><meshStandardMaterial color="#222" /></mesh>
      {/* Phone on desk */}
      <mesh position={[1.5, 1.0, -0.1]}><boxGeometry args={[0.22, 0.05, 0.14]} /><meshStandardMaterial color="#222" /></mesh>

      {interactive && (
        <Html position={[0, 2.3, 0]} center style={{ pointerEvents: "none" }}>
          <div className={`text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg ${
            hovered ? "bg-blue-500 text-white scale-110" : "bg-blue-900/90 text-blue-200 animate-bounce"
          }`}>
            {hovered ? "▶ Klicken!" : "LEITSTAND"}
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Clickable generic object ────────────────────────────────────────────────

function ClickableZone({ position, size, id, interactive, onSelect }: {
  position: [number, number, number]; size: [number, number, number]; id: string; interactive: boolean; onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const label = LABEL_MAP[id] ?? id;

  if (!interactive) return null;

  return (
    <group
      position={position}
      onClick={(e) => { e.stopPropagation(); onSelect(id); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
    >
      <mesh><boxGeometry args={size} /><meshStandardMaterial transparent opacity={0} /></mesh>
      <Html position={[0, size[1] / 2 + 0.5, 0]} center style={{ pointerEvents: "none" }}>
        <div className={`text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg ${
          hovered ? "bg-blue-500 text-white scale-110" : "bg-blue-900/90 text-blue-200 animate-bounce"
        }`}>
          {hovered ? "▶ Klicken!" : label}
        </div>
      </Html>
    </group>
  );
}

// ─── Industrial Ceiling Light ────────────────────────────────────────────────

function IndustrialLight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh><cylinderGeometry args={[0.5, 0.2, 0.25, 12]} /><meshStandardMaterial color="#aaa" metalness={0.7} /></mesh>
      <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[0.03, 0.03, 0.5, 6]} /><meshStandardMaterial color="#888" /></mesh>
      <pointLight intensity={40} distance={16} color="#ffe8cc" position={[0, -0.3, 0]} />
    </group>
  );
}

// ─── Exported Factory Scene ──────────────────────────────────────────────────

export interface FactoryFloorProps {
  alertLevel: "normal" | "warning" | "critical";
  interactiveObjects: string[];
  serverStatuses: Record<string, "healthy" | "warning" | "critical" | "offline">;
  onObjectSelect: (objectId: string) => void;
}

export default function FactoryFloorScene({ alertLevel, interactiveObjects, serverStatuses, onObjectSelect }: FactoryFloorProps) {
  const isAlarm = alertLevel === "critical" || alertLevel === "warning";

  const line1Status = serverStatuses["srv-app"] === "critical" || serverStatuses["srv-app"] === "offline" ? "error" :
                      serverStatuses["srv-app"] === "warning" ? "warning" : "ok";
  const line2Status = serverStatuses["srv-web"] === "critical" || serverStatuses["srv-web"] === "offline" ? "error" :
                      serverStatuses["srv-web"] === "warning" ? "warning" : "ok";
  const machine1Active = serverStatuses["srv-db"] !== "critical" && serverStatuses["srv-db"] !== "offline";
  const machine2Active = serverStatuses["srv-app"] !== "critical" && serverStatuses["srv-app"] !== "offline";
  const machine3Active = serverStatuses["srv-web"] !== "critical" && serverStatuses["srv-web"] !== "offline";

  // Check if any machine has fire status (used for smoke/fire effects)
  const hasFire = serverStatuses["srv-firewall"] === "critical";
  // Check for injured person scenario
  const hasInjury = serverStatuses["srv-mail"] === "critical";

  return (
    <Canvas
      shadows
      camera={{ position: [14, 10, 18], fov: 45 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3 }}
      style={{ background: "#2a2a28" }}
    >
      <color attach="background" args={["#2a2a28"]} />
      <fog attach="fog" args={["#2a2a28", 30, 55]} />

      {/* BRIGHT industrial lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[8, 14, 5]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} color="#fff8f0" />
      <directionalLight position={[-8, 10, -5]} intensity={0.5} color="#f0f0ff" />
      <hemisphereLight args={["#ffffff", "#888870", 0.3]} />

      {/* Alarm lighting */}
      {alertLevel === "critical" && (
        <>
          <pointLight position={[0, 7, 0]} color="#ff2200" intensity={6} distance={25} />
          <pointLight position={[-10, 5, -5]} color="#ff0000" intensity={3} distance={10} />
        </>
      )}

      {/* Fire effects */}
      {hasFire && (
        <>
          <pointLight position={[-8, 1, -5]} color="#ff4400" intensity={12} distance={8} />
          <pointLight position={[-7, 2, -4]} color="#ff6600" intensity={6} distance={5} />
          {/* Smoke clouds */}
          {[[-8, 4, -5], [-7, 5, -4], [-9, 3.5, -6]].map((pos, i) => (
            <group key={i}>
              {Array.from({ length: 3 }, (_, j) => (
                <mesh key={j} position={[pos[0] + (Math.random() - 0.5), pos[1] + j * 0.5, pos[2] + (Math.random() - 0.5)]}>
                  <sphereGeometry args={[0.5 + Math.random() * 0.5, 6, 6]} />
                  <meshStandardMaterial color="#555" transparent opacity={0.12} depthWrite={false} />
                </mesh>
              ))}
            </group>
          ))}
          {/* Fire glow on floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8, 0.01, -5]}>
            <circleGeometry args={[1.5, 16]} />
            <meshStandardMaterial color="#ff3300" emissive="#ff4400" emissiveIntensity={3} transparent opacity={0.3} />
          </mesh>
        </>
      )}

      <FactoryHall isAlarm={isAlarm} />

      {/* ═══ FERTIGUNGSLINIE 1 ═══ */}
      <ConveyorBelt position={[-5, 0, -5]} length={10} running={line1Status === "ok"} />
      <RobotArm position={[-9, 0, -5]} active={machine1Active} interactive={interactiveObjects.includes("srv-db")} id="srv-db" onSelect={onObjectSelect} />
      <RobotArm position={[-1, 0, -5]} active={machine2Active} interactive={interactiveObjects.includes("srv-app")} id="srv-app" onSelect={onObjectSelect} />
      <StackLight position={[-11, 0, -5]} status={line1Status} />
      <StackLight position={[1, 0, -5]} status={line1Status} />
      {/* Glow markers on interactive machines */}
      {interactiveObjects.includes("srv-db") && <><InteractiveGlow position={[-9, 0.01, -5]} color="#00ccff" /><InteractiveArrow position={[-9, 3.5, -5]} /></>}
      {interactiveObjects.includes("srv-app") && <><InteractiveGlow position={[-1, 0.01, -5]} color="#00ccff" /><InteractiveArrow position={[-1, 3.5, -5]} /></>}

      {/* ═══ FERTIGUNGSLINIE 2 ═══ */}
      <ConveyorBelt position={[-5, 0, 3]} length={10} running={line2Status === "ok"} />
      <RobotArm position={[-7, 0, 3]} active={machine3Active} interactive={interactiveObjects.includes("srv-web")} id="srv-web" onSelect={onObjectSelect} />
      <StackLight position={[-11, 0, 3]} status={line2Status} />
      <StackLight position={[1, 0, 3]} status={line2Status} />

      {/* ═══ BEDIENFELDER ═══ */}
      <HMIPanel position={[-5, 0, -1]} status={line1Status} interactive={interactiveObjects.includes("srv-monitor")} id="srv-monitor" onSelect={onObjectSelect} />
      {interactiveObjects.includes("srv-monitor") && <InteractiveGlow position={[-5, 0.01, -1]} radius={0.8} color="#00aaff" />}

      <HMIPanel position={[0, 0, -1]} status={line2Status} interactive={interactiveObjects.includes("srv-mail")} id="srv-mail" onSelect={onObjectSelect} />
      {interactiveObjects.includes("srv-mail") && <InteractiveGlow position={[0, 0.01, -1]} radius={0.8} color="#00aaff" />}

      {/* ═══ LEITSTAND ═══ */}
      <ControlRoom position={[9, 0, -1]} interactive={interactiveObjects.includes("monitor-main")} id="monitor-main" onSelect={onObjectSelect} />
      {interactiveObjects.includes("monitor-main") && <><InteractiveGlow position={[9, 0.01, -1]} radius={2.5} color="#3366ff" /><InteractiveArrow position={[9, 3, -1]} /></>}

      {/* ═══ SCHALTSCHRANK / STROMVERTEILER ═══ */}
      <group position={[13, 0, -7]}>
        <mesh position={[0, 1.3, 0]} castShadow><boxGeometry args={[1.8, 2.6, 0.9]} /><meshStandardMaterial color="#667766" metalness={0.5} roughness={0.3} /></mesh>
        <mesh position={[0.7, 1.3, 0.46]}><boxGeometry args={[0.04, 0.3, 0.04]} /><meshStandardMaterial color="#888" metalness={0.9} /></mesh>
        {Array.from({ length: 5 }, (_, i) => (
          <mesh key={i} position={[-0.6, 0.6 + i * 0.4, 0.46]}>
            <sphereGeometry args={[0.03]} />
            <meshStandardMaterial color={i < 2 ? (isAlarm ? "#ff0000" : "#00ff44") : "#0088ff"} emissive={i < 2 ? (isAlarm ? "#ff0000" : "#00ff44") : "#0088ff"} emissiveIntensity={2} />
          </mesh>
        ))}
        <ClickableZone position={[0, 1.3, 0.6]} size={[2, 2.8, 0.3]} id="network-switch" interactive={interactiveObjects.includes("network-switch")} onSelect={onObjectSelect} />
        {interactiveObjects.includes("network-switch") && <InteractiveGlow position={[0, 0.01, 0]} radius={1.5} color="#00ccff" />}
      </group>

      {/* ═══ SCHALTSCHRANK (srv-backup = Steuerungsschrank) ═══ */}
      <group position={[13, 0, -3]}>
        <mesh position={[0, 1, 0]}><boxGeometry args={[0.9, 2, 0.7]} /><meshStandardMaterial color="#556655" metalness={0.5} /></mesh>
        <mesh position={[0.35, 1, 0.36]}><boxGeometry args={[0.04, 0.25, 0.04]} /><meshStandardMaterial color="#888" metalness={0.9} /></mesh>
        {[0.5, 0.9, 1.3].map((y, i) => (
          <mesh key={i} position={[-0.3, y, 0.36]}><sphereGeometry args={[0.025]} /><meshStandardMaterial color={isAlarm && i === 0 ? "#ff4400" : "#00ff44"} emissive={isAlarm && i === 0 ? "#ff4400" : "#00ff44"} emissiveIntensity={2} /></mesh>
        ))}
        <ClickableZone position={[0, 1, 0.5]} size={[1.1, 2.2, 0.3]} id="srv-backup" interactive={interactiveObjects.includes("srv-backup")} onSelect={onObjectSelect} />
        {interactiveObjects.includes("srv-backup") && <InteractiveGlow position={[0, 0.01, 0]} radius={1} color="#00ccff" />}
      </group>

      {/* ═══ SICHERUNGSKASTEN ═══ */}
      <group position={[13, 0, 1]}>
        <mesh position={[0, 0.7, 0]}><boxGeometry args={[0.6, 1.2, 0.4]} /><meshStandardMaterial color="#556655" metalness={0.5} /></mesh>
        <ClickableZone position={[0, 0.7, 0.3]} size={[0.8, 1.4, 0.3]} id="srv-firewall" interactive={interactiveObjects.includes("srv-firewall")} onSelect={onObjectSelect} />
        {interactiveObjects.includes("srv-firewall") && <InteractiveGlow position={[0, 0.01, 0]} radius={0.8} color="#00ccff" />}
      </group>

      {/* ═══ NOT-HALT ═══ */}
      <group position={[-14.9, 1.5, -5]} rotation={[0, Math.PI / 2, 0]}>
        <mesh><boxGeometry args={[0.35, 0.35, 0.06]} /><meshStandardMaterial color="#ccaa00" /></mesh>
        <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.12, 0.14, 0.06, 16]} /><meshStandardMaterial color="#cc0000" emissive="#ff0000" emissiveIntensity={0.5} /></mesh>
        <ClickableZone position={[0, 0, 0.2]} size={[0.5, 0.5, 0.3]} id="emergency-stop" interactive={interactiveObjects.includes("emergency-stop")} onSelect={onObjectSelect} />
      </group>
      {/* Second NOT-HALT on other wall */}
      <group position={[-14.9, 1.5, 3]} rotation={[0, Math.PI / 2, 0]}>
        <mesh><boxGeometry args={[0.35, 0.35, 0.06]} /><meshStandardMaterial color="#ccaa00" /></mesh>
        <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.12, 0.14, 0.06, 16]} /><meshStandardMaterial color="#cc0000" emissive="#ff0000" emissiveIntensity={0.5} /></mesh>
      </group>

      {/* ═══ TELEFON ═══ */}
      <group position={[12, 0, 5]}>
        <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.5, 1, 0.35]} /><meshStandardMaterial color="#555" metalness={0.3} /></mesh>
        <mesh position={[0, 1.05, 0]}><boxGeometry args={[0.22, 0.04, 0.14]} /><meshStandardMaterial color="#222" /></mesh>
        <ClickableZone position={[0, 0.5, 0.3]} size={[0.8, 1.2, 0.5]} id="monitor-phone" interactive={interactiveObjects.includes("monitor-phone")} onSelect={onObjectSelect} />
        {interactiveObjects.includes("monitor-phone") && <InteractiveGlow position={[0, 0.01, 0]} radius={0.8} color="#00ccff" />}
      </group>

      {/* ═══ MEISTERBÜRO ═══ */}
      <group position={[12, 0, -4]}>
        <mesh position={[0, 0.8, 0]}><boxGeometry args={[1.3, 0.05, 0.8]} /><meshStandardMaterial color="#5a5a55" /></mesh>
        <mesh position={[0, 1.2, -0.25]}><boxGeometry args={[0.7, 0.45, 0.04]} /><meshStandardMaterial color="#111" emissive="#003388" emissiveIntensity={1} /></mesh>
        <mesh position={[0, 1.2, -0.27]}><boxGeometry args={[0.75, 0.5, 0.02]} /><meshStandardMaterial color="#222" /></mesh>
        <pointLight position={[0, 1.3, 0.2]} color="#3366ff" intensity={2} distance={3} />
        <ClickableZone position={[0, 1, 0]} size={[1.5, 1, 0.9]} id="monitor-email" interactive={interactiveObjects.includes("monitor-email")} onSelect={onObjectSelect} />
        {interactiveObjects.includes("monitor-email") && <InteractiveGlow position={[0, 0.01, 0]} radius={1} color="#3366ff" />}
      </group>

      {/* ═══ ERSTE-HILFE STATION ═══ */}
      <group position={[-14.5, 1.2, 0]}>
        {/* White cross on green */}
        <mesh rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[0.4, 0.4, 0.04]} /><meshStandardMaterial color="#00aa44" emissive="#00aa44" emissiveIntensity={0.5} /></mesh>
        <mesh position={[0.03, 0, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[0.15, 0.05, 0.02]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.5} /></mesh>
        <mesh position={[0.03, 0, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[0.05, 0.15, 0.02]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.5} /></mesh>
      </group>

      {/* ═══ FEUERLÖSCHER ═══ */}
      <group position={[-14.3, 0, -2]}>
        <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.1, 0.1, 0.7, 12]} /><meshStandardMaterial color="#cc0000" metalness={0.4} /></mesh>
        <mesh position={[0, 0.88, 0]}><cylinderGeometry args={[0.05, 0.1, 0.08, 12]} /><meshStandardMaterial color="#333" metalness={0.8} /></mesh>
      </group>
      <group position={[14.3, 0, 4]}>
        <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.1, 0.1, 0.7, 12]} /><meshStandardMaterial color="#cc0000" metalness={0.4} /></mesh>
        <mesh position={[0, 0.88, 0]}><cylinderGeometry args={[0.05, 0.1, 0.08, 12]} /><meshStandardMaterial color="#333" metalness={0.8} /></mesh>
      </group>

      {/* ═══ SAMMELPLATZ-SCHILD (an der Wand) ═══ */}
      <group position={[14.95, 2, 7]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh><boxGeometry args={[0.6, 0.4, 0.03]} /><meshStandardMaterial color="#00aa44" emissive="#00aa44" emissiveIntensity={0.3} /></mesh>
      </group>

      {/* ═══ MENSCHEN ═══ */}
      {/* Arbeiter an Linie 1 */}
      <PersonFigure position={[-6, 0, -3.5]} color="#2255aa" animated={!isAlarm} />
      <PersonFigure position={[-3, 0, -6.5]} color="#2255aa" animated={!isAlarm} />
      {/* Arbeiter an Linie 2 */}
      <PersonFigure position={[-5, 0, 4.5]} color="#2255aa" animated={!isAlarm} />
      {/* Schichtleiter (andere Farbe) */}
      <PersonFigure position={[3, 0, -1]} color="#aa4422" helmetColor="#ffffff" animated />
      {/* Meister im Büro */}
      <PersonFigure position={[12, 0, -3.5]} color="#226644" helmetColor="#ffffff" animated />
      {/* Person am Leitstand */}
      <PersonFigure position={[9, 0.3, 0.2]} color="#2255aa" animated />

      {/* Verletzte Person (nur wenn Szenario es erfordert) */}
      {hasInjury && (
        <>
          <PersonFigure position={[-3, 0, 3.5]} onGround color="#2255aa" />
          {/* Ersthelfer daneben */}
          <PersonFigure position={[-2, 0, 4]} color="#22aa44" helmetColor="#ffffff" />
          <pointLight position={[-3, 1, 3.5]} color="#ffaa00" intensity={4} distance={5} />
        </>
      )}

      {/* ═══ BELEUCHTUNG ═══ */}
      <IndustrialLight position={[-7, 7.5, -5]} />
      <IndustrialLight position={[0, 7.5, -5]} />
      <IndustrialLight position={[-7, 7.5, 3]} />
      <IndustrialLight position={[0, 7.5, 3]} />
      <IndustrialLight position={[9, 7.5, -1]} />
      <IndustrialLight position={[-4, 7.5, -1]} />
      <IndustrialLight position={[5, 7.5, 5]} />
      <IndustrialLight position={[-10, 7.5, 0]} />

      <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.1} minPolarAngle={0.2} minDistance={6} maxDistance={30} target={[0, 2, -1]} enableDamping dampingFactor={0.05} />
    </Canvas>
  );
}
