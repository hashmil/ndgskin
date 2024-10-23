// src/components/ChangeableModel.tsx

import React, { useEffect, useState } from "react";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
  Mesh,
  MeshStandardMaterial,
  Vector3,
  Euler,
  TextureLoader,
  RepeatWrapping,
  NearestFilter,
  Texture,
  Object3D,
} from "three";
import { Html, useProgress } from "@react-three/drei";
import { Loader } from "@react-three/drei";

interface ChangeableModelProps {
  url: string;
  scale: number;
  position: Vector3;
  mobilePosition: Vector3;
  rotation: Euler;
  textureUrl: string | null;
  isLoadingTexture: boolean; // Add this line
  onTextureLoaded: () => void;
}

const targetMeshNames = [
  "base-bottom",
  "base-main",
  "base-top",
  "main-section",
];

export const ChangeableModel = React.memo(function ChangeableModel({
  url,
  scale = 1,
  position = new Vector3(0, 0, 0),
  mobilePosition,
  rotation = new Euler(0, 0, 0),
  textureUrl,
  isLoadingTexture,
  onTextureLoaded,
}: ChangeableModelProps) {
  // Add validation for url
  if (!url) {
    console.error("Model URL is required");
    return (
      <Html center>
        <div>Error: Model URL is missing</div>
      </Html>
    );
  }

  // Wrap the loader in a try-catch
  try {
    const gltf = useLoader(GLTFLoader, url, undefined, (error) => {
      console.error("Error loading model:", error);
    });

    const [currentPosition, setCurrentPosition] = useState(position);

    useEffect(() => {
      const isMobile = window.innerWidth < 640; // SM breakpoint in Tailwind
      setCurrentPosition(isMobile ? mobilePosition : position);
    }, [position, mobilePosition]);

    useEffect(() => {
      if (textureUrl && gltf) {
        const texture = new TextureLoader().load(textureUrl, () => {
          texture.wrapS = RepeatWrapping;
          texture.wrapT = RepeatWrapping;
          texture.magFilter = NearestFilter;

          gltf.scene.traverse((child: Object3D) => {
            if (
              (child as Mesh).isMesh &&
              targetMeshNames.includes(child.name)
            ) {
              const material = (child as Mesh).material as MeshStandardMaterial;
              material.map = texture;
              material.needsUpdate = true;
            }
          });
          onTextureLoaded();
        });
      }
    }, [textureUrl, gltf, onTextureLoaded]);

    if (!gltf) {
      return (
        <Html center>
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
          </div>
        </Html>
      );
    }

    return (
      <group scale={scale} position={currentPosition} rotation={rotation}>
        <primitive object={gltf.scene} />
      </group>
    );
  } catch (error) {
    console.error("Error in ChangeableModel:", error);
    return (
      <Html center>
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
        </div>
      </Html>
    );
  }
});
