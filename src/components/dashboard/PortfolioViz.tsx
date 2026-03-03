'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const Bars = () => {
  const mesh1 = useRef<THREE.Mesh>(null);
  const mesh2 = useRef<THREE.Mesh>(null);
  const mesh3 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (mesh1.current) {
      mesh1.current.rotation.y = time * 0.2;
      mesh1.current.position.y = Math.sin(time) * 0.2 + 1.5;
    }
    if (mesh2.current) {
      mesh2.current.rotation.y = -time * 0.15;
      mesh2.current.position.y = Math.cos(time * 1.1) * 0.2 + 2;
    }
    if (mesh3.current) {
      mesh3.current.rotation.y = time * 0.25;
      mesh3.current.position.y = Math.sin(time * 0.9) * 0.2 + 1;
    }
  });

  return (
    <>
      <mesh ref={mesh1} position={[-1.5, 1.5, 0]}>
        <boxGeometry args={[0.4, 3, 0.4]} />
        <MeshDistortMaterial color="#00ff88" distort={0.4} speed={2} />
      </mesh>
      <mesh ref={mesh2} position={[0, 2, 0]}>
        <boxGeometry args={[0.6, 4, 0.6]} />
        <MeshDistortMaterial color="#ff0088" distort={0.3} speed={1.5} />
      </mesh>
      <mesh ref={mesh3} position={[1.5, 1, 0]}>
        <boxGeometry args={[0.5, 2.5, 0.5]} />
        <MeshDistortMaterial color="#8880ff" distort={0.5} speed={3} />
      </mesh>
    </>
  );
};

const PortfolioViz = () => {
  return (
    <div className="relative w-full h-[600px] rounded-3xl bg-black/50 border border-white/10 backdrop-blur-md overflow-hidden">
      <Canvas
        camera={{ position: [0, 2, 5], fov: 60 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <color attach="background" args={['black']} />
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Bars />
        <OrbitControls enablePan={false} enableZoom={true} enableDamping={true} dampingFactor={0.05} />
      </Canvas>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center text-white/80 backdrop-blur-sm bg-black/30 px-8 py-4 rounded-2xl border border-white/20">
          <h3 className="text-xl font-bold mb-1">Portfolio Visualization</h3>
          <p className="text-sm">3D Investment Growth Projection</p>
        </div>
      </div>
    </div>
  );
};

export default PortfolioViz;
