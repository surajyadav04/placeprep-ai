import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/* ── Neural Particle System (Pastel) ── */
function NeuralParticles({ count = 80, color = '#E9D8FD', connectionDistance = 3, mouseReactivity = 0.2, speed = 0.08, spread = 20 }) {
  const pointsRef = useRef();
  const linesRef = useRef();
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const mouse3D = useRef(new THREE.Vector3(0, 0, 0));
  const { viewport } = useThree();

  // Track mouse
  useEffect(() => {
    const handleMouse = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  // Generate particle positions and velocities
  const { positions, velocities, basePositions } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const base = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * spread;
      pos[i3 + 1] = (Math.random() - 0.5) * spread;
      pos[i3 + 2] = (Math.random() - 0.5) * (spread * 0.5);
      base[i3] = pos[i3];
      base[i3 + 1] = pos[i3 + 1];
      base[i3 + 2] = pos[i3 + 2];
      vel[i3] = (Math.random() - 0.5) * speed;
      vel[i3 + 1] = (Math.random() - 0.5) * speed;
      vel[i3 + 2] = (Math.random() - 0.5) * speed * 0.3;
    }
    return { positions: pos, velocities: vel, basePositions: base };
  }, [count, spread, speed]);

  // Line geometry for connections
  const linePositions = useMemo(() => new Float32Array(count * count * 6), [count]);
  const lineColors = useMemo(() => new Float32Array(count * count * 8), [count]);

  // Point material for light backgrounds
  const pointMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float aOpacity;
        varying float vOpacity;
        void main() {
          vOpacity = aOpacity;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (4.0 / -mvPos.z) * 100.0;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vOpacity;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.1, d);
          gl_FragColor = vec4(uColor, alpha * vOpacity * 0.9);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
  }, [color]);

  // Opacity attribute
  const opacities = useMemo(() => {
    const o = new Float32Array(count);
    for (let i = 0; i < count; i++) o[i] = 0.4 + Math.random() * 0.6;
    return o;
  }, [count]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const posArray = pointsRef.current.geometry.attributes.position.array;

    // Update mouse 3D position
    mouse3D.current.x += (mouseRef.current.x * viewport.width * 0.5 - mouse3D.current.x) * 0.05;
    mouse3D.current.y += (mouseRef.current.y * viewport.height * 0.5 - mouse3D.current.y) * 0.05;

    // Animate particles
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Organic drift
      posArray[i3] += velocities[i3] * 0.016;
      posArray[i3 + 1] += velocities[i3 + 1] * 0.016;
      posArray[i3 + 2] += velocities[i3 + 2] * 0.016;

      // Gentle return to base with noise
      posArray[i3] += (basePositions[i3] + Math.sin(t * 0.2 + i * 0.5) * 0.5 - posArray[i3]) * 0.003;
      posArray[i3 + 1] += (basePositions[i3 + 1] + Math.cos(t * 0.15 + i * 0.3) * 0.5 - posArray[i3 + 1]) * 0.003;

      // Mouse reactivity — subtle push
      const dx = posArray[i3] - mouse3D.current.x;
      const dy = posArray[i3 + 1] - mouse3D.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5) {
        const force = (5 - dist) * mouseReactivity * 0.01;
        posArray[i3] += dx * force;
        posArray[i3 + 1] += dy * force;
      }

      // Boundary wrap
      const half = spread * 0.5;
      if (posArray[i3] > half) posArray[i3] = -half;
      if (posArray[i3] < -half) posArray[i3] = half;
      if (posArray[i3 + 1] > half) posArray[i3 + 1] = -half;
      if (posArray[i3 + 1] < -half) posArray[i3 + 1] = half;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Update connections
    if (!linesRef.current) return;
    let lineIdx = 0;
    const col = new THREE.Color(color);

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const i3 = i * 3, j3 = j * 3;
        const dx = posArray[i3] - posArray[j3];
        const dy = posArray[i3 + 1] - posArray[j3 + 1];
        const dz = posArray[i3 + 2] - posArray[j3 + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (d < connectionDistance) {
          const alpha = (1 - d / connectionDistance) * 0.25;
          const li = lineIdx * 6;
          const ci = lineIdx * 8;

          linePositions[li] = posArray[i3];
          linePositions[li + 1] = posArray[i3 + 1];
          linePositions[li + 2] = posArray[i3 + 2];
          linePositions[li + 3] = posArray[j3];
          linePositions[li + 4] = posArray[j3 + 1];
          linePositions[li + 5] = posArray[j3 + 2];

          lineColors[ci] = col.r; lineColors[ci + 1] = col.g; lineColors[ci + 2] = col.b; lineColors[ci + 3] = alpha;
          lineColors[ci + 4] = col.r; lineColors[ci + 5] = col.g; lineColors[ci + 6] = col.b; lineColors[ci + 7] = alpha;

          lineIdx++;
        }
      }
    }

    // Clear remaining
    for (let i = lineIdx * 6; i < linePositions.length; i++) linePositions[i] = 0;
    for (let i = lineIdx * 8; i < lineColors.length; i++) lineColors[i] = 0;

    linesRef.current.geometry.attributes.position.needsUpdate = true;
    linesRef.current.geometry.attributes.color.needsUpdate = true;
    linesRef.current.geometry.setDrawRange(0, lineIdx * 2);

    // Update uniforms
    pointMaterial.uniforms.uTime.value = t;
  });

  return (
    <group>
      <points ref={pointsRef} material={pointMaterial}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
          <bufferAttribute attach="attributes-aOpacity" array={opacities} count={count} itemSize={1} />
        </bufferGeometry>
      </points>

      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={linePositions} count={linePositions.length / 3} itemSize={3} usage={THREE.DynamicDrawUsage} />
          <bufferAttribute attach="attributes-color" array={lineColors} count={lineColors.length / 4} itemSize={4} usage={THREE.DynamicDrawUsage} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={1} blending={THREE.NormalBlending} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

/* ── Main Export: Particle Field Canvas ── */
export default function ParticleField({
  count = 70,
  color = '#A0AEC0', // Soft Slate
  connectionDistance = 3.5,
  mouseReactivity = 0.2,
  speed = 0.08,
  spread = 22,
  showGeo = false,
  className = '',
  style = {},
}) {
  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        ...style,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 14], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <fog attach="fog" args={['#FDFBF7', 10, 30]} />
        <NeuralParticles
          count={count}
          color={color}
          connectionDistance={connectionDistance}
          mouseReactivity={mouseReactivity}
          speed={speed}
          spread={spread}
        />
      </Canvas>
    </div>
  );
}
