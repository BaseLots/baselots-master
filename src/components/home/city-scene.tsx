"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// Seeded random number generator
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function Buildings() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const goldMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate realistic street layout
  const streets = useMemo(() => {
    let currentSeed = 1000;
    
    const streetPaths = [];

    // Main arterial roads (major highways) - wider, long, evenly spaced
    const arterialSpacing = 20;
    for (let i = -2; i <= 2; i++) {
      // Horizontal arterials
      streetPaths.push({
        isHorizontal: true,
        position: i * arterialSpacing,
        offset: 0,
        length: 90,
        width: 2.5,
        type: "arterial",
      });

      // Vertical arterials
      streetPaths.push({
        isHorizontal: false,
        position: i * arterialSpacing,
        offset: 0,
        length: 90,
        width: 2.5,
        type: "arterial",
      });
    }

    // Secondary roads (connectors between arterials) - medium width
    const secondarySpacing = 10;
    for (let i = -4; i <= 4; i++) {
      if (i % 2 === 0) continue; // Skip positions where arterials exist

      // Horizontal secondaries
      streetPaths.push({
        isHorizontal: true,
        position: i * secondarySpacing,
        offset: 0,
        length: 85,
        width: 1.8,
        type: "secondary",
      });

      // Vertical secondaries
      streetPaths.push({
        isHorizontal: false,
        position: i * secondarySpacing,
        offset: 0,
        length: 85,
        width: 1.8,
        type: "secondary",
      });
    }

    // Local residential streets - narrower, shorter
    for (let i = -8; i <= 8; i++) {
      if (i % 2 === 0 && Math.abs(i) <= 4) continue; // Skip main roads

      const offset = (seededRandom(currentSeed++) - 0.5) * 8;
      const length = 15 + seededRandom(currentSeed++) * 25;

      // Horizontal local streets
      if (seededRandom(currentSeed++) > 0.3) {
        streetPaths.push({
          isHorizontal: true,
          position: i * 5 + (seededRandom(currentSeed++) - 0.5) * 2,
          offset: offset,
          length: length,
          width: 1.2,
          type: "local",
        });
      }

      // Vertical local streets
      if (seededRandom(currentSeed++) > 0.3) {
        streetPaths.push({
          isHorizontal: false,
          position: i * 5 + (seededRandom(currentSeed++) - 0.5) * 2,
          offset: offset,
          length: length,
          width: 1.2,
          type: "local",
        });
      }
    }

    return streetPaths;
  }, []);

  // Check if a point is too close to any street
  const isNearStreet = useMemo(() => {
    return (x: number, z: number) => {
      return streets.some((street) => {
        const threshold = street.width / 2 + 0.5; // Half street width plus buffer
        if (street.isHorizontal) {
          return (
            Math.abs(z - street.position) < threshold &&
            Math.abs(x - street.offset) < street.length / 2
          );
        } else {
          return (
            Math.abs(x - street.position) < threshold &&
            Math.abs(z - street.offset) < street.length / 2
          );
        }
      });
    };
  }, [streets]);

  // Generate building positions and sizes
  const { buildings, goldBuildings } = useMemo(() => {
    let currentSeed = 2000;

    const regularItems = [];
    const goldItems = [];
    const gridSize = 30;
    const spacing = 1.4;

    for (let x = -gridSize; x <= gridSize; x++) {
      for (let z = -gridSize; z <= gridSize; z++) {
        const worldX = x * spacing;
        const worldZ = z * spacing;

        // Skip if near a street
        if (isNearStreet(worldX, worldZ)) continue;

        // More gaps for yards/spacing
        if (seededRandom(currentSeed++) > 0.75) continue;

        // Center park/clearing
        if (Math.abs(x) < 3 && Math.abs(z) < 3) continue;

        const dist = Math.sqrt(x * x + z * z);

        // Residential heights
        const isTwoStory = seededRandom(currentSeed++) > 0.7;
        const height = isTwoStory
          ? seededRandom(currentSeed++) * 0.3 + 1.5
          : seededRandom(currentSeed++) * 0.4 + 0.8;

        const delay = dist * 0.06;

        // Vary width/depth slightly
        const width = 0.8 + seededRandom(currentSeed++) * 0.3;
        const depth = 0.8 + seededRandom(currentSeed++) * 0.3;

        const building = {
          x: worldX,
          z: worldZ,
          height,
          width,
          depth,
          delay,
          grown: false,
        };

        // ~4% chance to be golden
        if (seededRandom(currentSeed++) > 0.94) {
          goldItems.push(building);
        } else {
          regularItems.push(building);
        }
      }
    }
    return { buildings: regularItems, goldBuildings: goldItems };
  }, [isNearStreet]);

  // Animation
  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;

    // Animate regular buildings
    if (meshRef.current) {
      let needsUpdate = false;

      buildings.forEach((building, i) => {
        const timeSinceStart = elapsed - building.delay;

        if (timeSinceStart > 0) {
          const progress = Math.min(timeSinceStart * 2, 1);
          const currentHeight = building.height * progress;

          dummy.position.set(building.x, currentHeight / 2, building.z);
          dummy.scale.set(building.width, currentHeight, building.depth);
          dummy.updateMatrix();
          meshRef.current!.setMatrixAt(i, dummy.matrix);

          if (progress < 1) needsUpdate = true;
          if (progress >= 1 && !building.grown) {
            building.grown = true;
          }
        } else {
          dummy.position.set(building.x, 0, building.z);
          dummy.scale.set(building.width, 0.01, building.depth);
          dummy.updateMatrix();
          meshRef.current!.setMatrixAt(i, dummy.matrix);
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        meshRef.current.instanceMatrix.needsUpdate = true;
      }
    }

    // Animate gold buildings
    if (goldMeshRef.current) {
      let needsUpdate = false;

      goldBuildings.forEach((building, i) => {
        const timeSinceStart = elapsed - building.delay;

        if (timeSinceStart > 0) {
          const progress = Math.min(timeSinceStart * 2, 1);
          const currentHeight = building.height * progress;

          dummy.position.set(building.x, currentHeight / 2, building.z);
          dummy.scale.set(building.width, currentHeight, building.depth);
          dummy.updateMatrix();
          goldMeshRef.current!.setMatrixAt(i, dummy.matrix);

          if (progress < 1) needsUpdate = true;
          if (progress >= 1 && !building.grown) {
            building.grown = true;
          }
        } else {
          dummy.position.set(building.x, 0, building.z);
          dummy.scale.set(building.width, 0.01, building.depth);
          dummy.updateMatrix();
          goldMeshRef.current!.setMatrixAt(i, dummy.matrix);
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        goldMeshRef.current.instanceMatrix.needsUpdate = true;
      }
    }
  });

  return (
    <>
      {/* Regular buildings - Metallic black */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, buildings.length]}
        frustumCulled={false}
      >
        <boxGeometry args={[0.9, 1, 0.9]} />
        <meshStandardMaterial
          color="#111111"
          roughness={0.2}
          metalness={0.8}
        />
      </instancedMesh>

      {/* Accent buildings - Glowing gold */}
      <instancedMesh
        ref={goldMeshRef}
        args={[undefined, undefined, goldBuildings.length]}
        frustumCulled={false}
      >
        <boxGeometry args={[0.9, 1, 0.9]} />
        <meshStandardMaterial
          color="#fb923c"
          emissive="#fb923c"
          emissiveIntensity={2}
          roughness={0.1}
          metalness={0.1}
        />
      </instancedMesh>

      {/* Ground - Black metal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color="#050505"
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>

      {/* Streets - Dark grey */}
      {streets.map((street, i) => {
        const color = "#222222";

        // Different Y positions to prevent flickering (z-fighting)
        const yPos =
          street.type === "arterial"
            ? 0.008 // Arterials on top
            : street.type === "secondary"
            ? 0.005 // Secondaries in middle
            : 0.004; // Local streets at bottom

        return (
          <mesh
            key={`street-${i}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={
              street.isHorizontal
                ? [street.offset, yPos, street.position]
                : [street.position, yPos, street.offset]
            }
          >
            <planeGeometry
              args={
                street.isHorizontal
                  ? [street.length, street.width]
                  : [street.width, street.length]
              }
            />
            <meshStandardMaterial
              color={color}
              roughness={0.2}
              metalness={0.7}
            />
          </mesh>
        );
      })}
    </>
  );
}

export function CityScene() {
  return (
    <div className="w-full h-full absolute inset-0 z-0 bg-black">
      <Canvas
        dpr={[1, 1.5]}
        // Removed custom gl config to ensure stability and context recovery
      >
        <PerspectiveCamera makeDefault position={[35, 25, 35]} fov={50} />
        <OrbitControls
          autoRotate
          autoRotateSpeed={0.5}
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.5}
          minPolarAngle={Math.PI / 6}
        />

        <ambientLight intensity={1.5} />
        
        {/* Balanced lighting setup */}
        <directionalLight
          position={[-10, 20, 10]}
          intensity={1.5}
          color="#ffffff"
        />
        <directionalLight
          position={[10, 20, -10]}
          intensity={1.0}
          color="#e5e5e5"
        />
        <directionalLight
          position={[0, 20, 0]}
          intensity={0.5}
          color="#ffffff"
        />
        
        <hemisphereLight args={["#333", "#111", 1.0]} />

        <Buildings />

        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 20, 80]} />
        
        <Suspense fallback={null}>
          <EffectComposer autoClear={false}>
            <Bloom
              luminanceThreshold={1.2}
              mipmapBlur
              intensity={1.5}
              radius={0.6}
            />
          </EffectComposer>
          
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
