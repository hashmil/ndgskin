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
  isLoadingTexture: boolean;
  onTextureLoaded: () => void;
}

const targetMeshNames = [
  "bottle", // Updated target mesh name
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
    const isMobile = window.innerWidth < 640; // SM breakpoint in Tailwind
    setCurrentPosition(isMobile ? mobilePosition : position);
  }, [position, mobilePosition]);

  useEffect(() => {
    console.log("ChangeableModel useEffect - textureUrl:", textureUrl);
    console.log("ChangeableModel useEffect - gltf exists:", !!gltf);
    if (gltf && textureUrl) {
      const textureLoader = new TextureLoader();
      const texture = textureLoader.load(textureUrl, () => {
        console.log("ChangeableModel: Texture loaded successfully from:", textureUrl);
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.magFilter = NearestFilter;
        texture.flipY = false; // Important for GLTF textures

        gltf.scene.traverse((child: Object3D) => {
          if ((child as Mesh).isMesh) { // Process all meshes
            const material = (child as Mesh).material as MeshStandardMaterial;
            
            // Override base color to white and turn off emissive for testing
            material.color.setRGB(1, 1, 1); // Set base color to white
            material.emissive.setRGB(0, 0, 0); // Ensure no emissive color
            material.emissiveIntensity = 0; // Ensure no emissive intensity

            if (targetMeshNames.includes(child.name)) {
              console.log("Applying texture to mesh:", child.name);
              console.log("Material type:", material.type);
              // console.log("Material object:", material); // Reduce verbosity for now
              console.log("Set material base color to:", material.color);
              console.log("Set material emissive color to:", material.emissive);
              console.log("Set material emissive intensity to:", material.emissiveIntensity);
              material.map = texture; // RE-ENABLED
              material.needsUpdate = true;
            } else {
              // For non-target meshes, still log that we've reset their color/emissive
              console.log("Reset color/emissive for mesh:", child.name);
              console.log("  Material type:", material.type);
              // console.log("  Material object:", material);
              material.needsUpdate = true; // Ensure updates if we changed color/emissive
            }
          }
        });
        onTextureLoaded();
      });
    } else if (gltf) {
      // If no textureUrl, traverse and set materials to white for inspection
      gltf.scene.traverse((child: Object3D) => {
        if ((child as Mesh).isMesh) {
          const material = (child as Mesh).material as MeshStandardMaterial;
          // Override base color to white and turn off emissive for testing
          material.color.setRGB(1, 1, 1);
          material.emissive.setRGB(0, 0, 0);
          material.emissiveIntensity = 0;
          material.needsUpdate = true;

          console.log("Mesh (no texture, color/emissive reset):", child.name);
          console.log("  Material type:", material.type);
          // console.log("  Material object:", material);
          console.log("  Set material base color to:", material.color);
          console.log("  Set material emissive color to:", material.emissive);
          console.log("  Set material emissive intensity to:", material.emissiveIntensity);
        }
      });
    }
  }, [gltf, textureUrl, targetMeshNames, onTextureLoaded]);

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
    </group>
  );
});
