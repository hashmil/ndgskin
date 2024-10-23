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
import { Html } from "@react-three/drei";

type ChangeableModelProps = {
  url: string;
  scale?: number;
  position?: Vector3;
  mobilePosition?: Vector3; // New prop for mobile positioning
  rotation?: Euler;
  textureUrl?: string | null; // Update this line
  isLoadingTexture: boolean; // Add this line
  onTextureLoaded: () => void; // Add this line
};

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
  mobilePosition, // New prop
  rotation = new Euler(0, 0, 0),
  textureUrl,
  isLoadingTexture,
  onTextureLoaded,
}: ChangeableModelProps) {
  const gltf = useLoader(GLTFLoader, url);
  const [targetMeshes, setTargetMeshes] = useState<Mesh[]>([]);
  const [currentTexture, setCurrentTexture] = useState<Texture | null>(null);
  const [currentPosition, setCurrentPosition] = useState(position);

  // Find target meshes
  useEffect(() => {
    if (gltf) {
      const meshes: Mesh[] = [];
      gltf.scene.traverse((child: Object3D) => {
        if ((child as Mesh).isMesh && targetMeshNames.includes(child.name)) {
          console.log("Target mesh found:", child.name);
          meshes.push(child as Mesh);
        }
      });
      setTargetMeshes(meshes);
    }
  }, [gltf]);

  // Load generated texture when textureUrl changes
  useEffect(() => {
    if (textureUrl && textureUrl !== currentTexture?.userData?.url) {
      const loader = new TextureLoader();
      loader.load(
        textureUrl,
        (loadedTexture) => {
          loadedTexture.wrapS = loadedTexture.wrapT = RepeatWrapping;
          loadedTexture.minFilter = loadedTexture.magFilter = NearestFilter;
          loadedTexture.repeat.set(1, 1);
          loadedTexture.userData = { url: textureUrl };
          setCurrentTexture(loadedTexture);
          console.log("Generated texture loaded successfully");
          onTextureLoaded();
        },
        undefined,
        (error) => {
          console.error("Error loading generated texture:", error);
          onTextureLoaded();
        }
      );
    } else if (!textureUrl) {
      setCurrentTexture(null);
      onTextureLoaded();
    }
  }, [textureUrl, onTextureLoaded]);

  // Apply current texture or default material to target meshes
  useEffect(() => {
    if (targetMeshes.length > 0) {
      targetMeshes.forEach((mesh) => {
        if (currentTexture) {
          const material = new MeshStandardMaterial({
            map: currentTexture,
            roughness: 0.5,
            metalness: 0.5,
          });
          mesh.material = material;
          mesh.material.needsUpdate = true;
          console.log(
            `Applied generated texture to mesh ${mesh.name}`,
            material
          );
        } else {
          // Apply default material if no texture is available
          const material = new MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.5,
            metalness: 0.5,
          });
          mesh.material = material;
          mesh.material.needsUpdate = true;
          console.log(
            `Applied default material to mesh ${mesh.name}`,
            material
          );
        }
      });
    }
  }, [currentTexture, targetMeshes]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640 && mobilePosition) {
        setCurrentPosition(mobilePosition);
      } else {
        setCurrentPosition(position);
      }
    };

    handleResize(); // Set initial position
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [position, mobilePosition]);

  useEffect(() => {
    if (currentTexture && targetMeshes.length > 0) {
      console.log("Applying texture to meshes");
      targetMeshes.forEach((mesh) => {
        if (mesh.material instanceof MeshStandardMaterial) {
          if (mesh.material.map !== currentTexture) {
            console.log(`Applying new texture to mesh ${mesh.name}`);
            mesh.material.map = currentTexture;
            mesh.material.needsUpdate = true;
          }
        }
      });
      console.log("Calling onTextureLoaded");
      onTextureLoaded();
    }
  }, [currentTexture, targetMeshes, onTextureLoaded]);

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
