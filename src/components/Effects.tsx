// src/components/Effects.tsx

import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { 
  WebGLRenderer, 
  ACESFilmicToneMapping, 
  PCFSoftShadowMap,
  Scene,
  PerspectiveCamera
} from 'three';
import { 
  EffectComposer, 
  RenderPass, 
  BloomEffect, 
  EffectPass,
  KernelSize
} from 'postprocessing';

interface EffectsProps {
  bloomIntensity?: number;
  luminanceThreshold?: number;
  luminanceSmoothing?: number;
  bloomRadius?: number;
}

export function Effects({
  bloomIntensity = 1.0,
  luminanceThreshold = 0.9,
  luminanceSmoothing = 0.025,
  bloomRadius = 1.0,
}: EffectsProps) {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer>();
  const bloomRef = useRef<BloomEffect>();

  // Create composer and effects
  useEffect(() => {
    const renderer = gl as WebGLRenderer;
    
    // Enable tone mapping
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    // Enable shadows
    if (renderer.shadowMap) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = PCFSoftShadowMap;
    }

    // Create effect composer
    const composer = new EffectComposer(renderer);
    
    // Add render pass
    const renderPass = new RenderPass(scene as Scene, camera as PerspectiveCamera);
    composer.addPass(renderPass);
    
    // Determine kernel size based on radius for more spread
    const getKernelSize = (radius: number) => {
      if (radius <= 1.0) return KernelSize.SMALL;
      if (radius <= 2.0) return KernelSize.MEDIUM;
      if (radius <= 3.0) return KernelSize.LARGE;
      if (radius <= 4.0) return KernelSize.VERY_LARGE;
      return KernelSize.HUGE;
    };

    // Create bloom effect with correct property names
    const bloomEffect = new BloomEffect({
      intensity: bloomIntensity * bloomRadius, // Scale intensity with radius for more spread
      luminanceThreshold: luminanceThreshold,
      luminanceSmoothing: luminanceSmoothing,
      kernelSize: getKernelSize(bloomRadius),
    });
    
    // Add effect pass
    const effectPass = new EffectPass(camera as PerspectiveCamera, bloomEffect);
    composer.addPass(effectPass);
    
    // Store references
    composerRef.current = composer;
    bloomRef.current = bloomEffect;
    
    // Set composer size
    composer.setSize(size.width, size.height);
    
    return () => {
      composer.dispose();
    };
  }, [gl, scene, camera, bloomIntensity, luminanceThreshold, luminanceSmoothing, bloomRadius]);

  // Update composer size
  useEffect(() => {
    if (composerRef.current) {
      composerRef.current.setSize(size.width, size.height);
    }
  }, [size]);

  // Render with composer
  useFrame((_, delta) => {
    if (composerRef.current) {
      composerRef.current.render(delta);
    }
  }, 1);

  return null;
}