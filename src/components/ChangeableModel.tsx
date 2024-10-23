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
  const gltf = useLoader(GLTFLoader, url);
  const [currentPosition, setCurrentPosition] = useState(position);

  useEffect(() => {
    // Your position update logic here
  }, [position, mobilePosition]);

  if (!gltf) {
    return (
      <Html center>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <div className="loading-spinner"></div>
        </div>
      </Html>
    );
  }

  return (
    <group scale={scale} position={currentPosition} rotation={rotation}>
      <primitive object={gltf.scene} />
      {isLoadingTexture && (
        <Html center>
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
          </div>
        </Html>
      )}
    </group>
  );
});
