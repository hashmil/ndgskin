import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, Euler } from 'three';
import { ChangeableModel } from './ChangeableModel';

interface AnimatedModelWrapperProps {
  isLoaded: boolean;
  url: string;
  scale: number;
  targetPosition: Vector3;
  mobilePosition: Vector3;
  targetRotation: Euler;
  textureUrl: string | null;
  onTextureLoaded: () => void;
  onModelLoaded: () => void;
}

export function AnimatedModelWrapper({
  isLoaded,
  url,
  scale,
  targetPosition,
  mobilePosition,
  targetRotation,
  textureUrl,
  onTextureLoaded,
  onModelLoaded,
}: AnimatedModelWrapperProps) {
  const groupRef = useRef<Group>(null);
  const animationStarted = useRef(false);
  const animationProgress = useRef(0);

  // Starting position (from top) and rotation (with spin)
  const startPosition = new Vector3(targetPosition.x, targetPosition.y + 3, targetPosition.z);
  const startRotation = new Euler(targetRotation.x, targetRotation.y + Math.PI * 2, targetRotation.z);

  useEffect(() => {
    if (isLoaded && !animationStarted.current) {
      animationStarted.current = true;
      animationProgress.current = 0;
    }
  }, [isLoaded]);

  useFrame((_, delta) => {
    if (groupRef.current && animationStarted.current && animationProgress.current < 1) {
      // Animate over 2.5 seconds (slower)
      animationProgress.current = Math.min(animationProgress.current + delta / 2.5, 1);
      
      // Smooth easing function (ease-out)
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
      const progress = easeOut(animationProgress.current);

      // Interpolate position
      groupRef.current.position.lerpVectors(startPosition, targetPosition, progress);
      
      // Interpolate rotation with spin
      groupRef.current.rotation.set(
        startRotation.x + (targetRotation.x - startRotation.x) * progress,
        startRotation.y + (targetRotation.y - startRotation.y) * progress,
        startRotation.z + (targetRotation.z - startRotation.z) * progress
      );
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      <ChangeableModel
        url={url}
        scale={1}
        position={new Vector3(0, 0, 0)}
        mobilePosition={mobilePosition}
        rotation={new Euler(0, 0, 0)}
        textureUrl={textureUrl}
        onTextureLoaded={onTextureLoaded}
        onModelLoaded={onModelLoaded}
        visible={isLoaded}
      />
    </group>
  );
}