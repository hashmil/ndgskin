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

type ChangeableModelProps = {
  url: string;
  scale?: number;
  position?: Vector3;
  rotation?: Euler;
  textureUrl?: string | null; // Updated to accept string, undefined, or null
};

const targetMeshNames = [
  "base-bottom",
  "base-main",
  "base-top",
  "main-section",
];

export function ChangeableModel({
  url,
  scale = 1,
  position = new Vector3(0, 0, 0),
  rotation = new Euler(0, 0, 0),
  textureUrl,
}: ChangeableModelProps) {
  const gltf = useLoader(GLTFLoader, url);
  const [targetMeshes, setTargetMeshes] = useState<Mesh[]>([]);
  const [currentTexture, setCurrentTexture] = useState<Texture | null>(null);

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
    if (textureUrl) {
      const loader = new TextureLoader();
      loader.load(
        textureUrl,
        (loadedTexture) => {
          loadedTexture.wrapS = loadedTexture.wrapT = RepeatWrapping;
          loadedTexture.minFilter = loadedTexture.magFilter = NearestFilter;
          loadedTexture.repeat.set(1, 1); // Adjust as needed
          setCurrentTexture(loadedTexture);
          console.log("Generated texture loaded successfully");
        },
        undefined,
        (error) => {
          console.error("Error loading generated texture:", error);
        }
      );
    } else {
      setCurrentTexture(null);
    }
  }, [textureUrl]);

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

  return (
    <group scale={scale} position={position} rotation={rotation}>
      <primitive object={gltf.scene} />
    </group>
  );
}
