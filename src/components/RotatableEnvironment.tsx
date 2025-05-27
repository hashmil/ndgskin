import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

interface RotatableEnvironmentProps {
  preset: string;
  background: boolean;
  rotation: number;
}

export function RotatableEnvironment({ preset, background, rotation }: RotatableEnvironmentProps) {
  const { scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  // Update group rotation when rotation prop changes
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = rotation;
    }
  }, [rotation]);

  // Handle environment texture rotation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scene.environment) {
        // Force the environment to update by setting needsUpdate
        scene.environment.needsUpdate = true;

        // Check if it's a cube texture by checking the constructor
        if (scene.environment instanceof THREE.CubeTexture) {
          // For cube textures, rotation is handled by the group
          scene.environment.needsUpdate = true;
        } else if (scene.environment.isTexture) {
          // For regular textures, we can try to rotate the texture itself
          scene.environment.rotation = rotation;
          scene.environment.needsUpdate = true;
        }
      }
    }, 100); // Small delay to ensure environment is loaded

    return () => clearTimeout(timer);
  }, [scene, rotation, preset]);

  return (
    <group ref={groupRef} rotation={[0, rotation, 0]}>
      <Environment
        preset={preset as any}
        background={background}
      />
    </group>
  );
}
