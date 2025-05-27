// src/components/ChangeableModel.tsx

import React, { useEffect, useState } from "react";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
  Mesh,
  MeshPhysicalMaterial,
  Vector3,
  Euler,
  TextureLoader,
  RepeatWrapping,
  NearestFilter,
  Texture,
  Object3D,
  Color,
  BufferGeometry,
} from "three";
import { Html, useProgress } from "@react-three/drei";

// Helper function to get the average color of an image
function getAverageRGB(imgEl: HTMLImageElement | HTMLCanvasElement | ImageBitmap): { r: number; g: number; b: number } {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return { r: 1, g: 1, b: 1 }; // Default to white if context fails

  const TGT_SIZE = 1; // Draw image as 1x1 pixel to get average color
  canvas.width = TGT_SIZE;
  canvas.height = TGT_SIZE;

  try {
    context.drawImage(imgEl, 0, 0, TGT_SIZE, TGT_SIZE);
    const data = context.getImageData(0, 0, TGT_SIZE, TGT_SIZE).data;
    return { r: data[0] / 255, g: data[1] / 255, b: data[2] / 255 };
  } catch (e) {
    console.error("Error getting image data for average color:", e);
    return { r: 1, g: 1, b: 1 }; // Default to white on error (e.g., CORS)
  }
}

// Helper function to fix geometry normals
function fixGeometryNormals(gltf: any) {
  gltf.scene.traverse((child: Object3D) => {
    if ((child as Mesh).isMesh) {
      const mesh = child as Mesh;
      const geometry = mesh.geometry as BufferGeometry;
      
      // Compute vertex normals for proper lighting
      geometry.computeVertexNormals();
      
      console.log(`Fixed normals for mesh: ${child.name}`);
    }
  });
}

// Phone model mesh names - will need to be updated based on actual mesh names in the GLB
const targetMeshNames = [
  "phone", // Main phone body - will be updated after inspecting the model
];

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

  // Fix geometry normals when GLTF loads
  useEffect(() => {
    if (gltf) {
      fixGeometryNormals(gltf);
    }
  }, [gltf]);

  useEffect(() => {
    const isMobile = window.innerWidth < 640; // SM breakpoint in Tailwind
    setCurrentPosition(isMobile ? mobilePosition : position);
  }, [position, mobilePosition]);

  useEffect(() => {
    console.log("ChangeableModel useEffect - textureUrl:", textureUrl);
    console.log("ChangeableModel useEffect - gltf exists:", !!gltf);
    if (gltf && textureUrl) {
      const textureLoader = new TextureLoader();
      const texture = textureLoader.load(textureUrl, (loadedTexture) => {
        console.log("ChangeableModel: Texture loaded successfully from:", textureUrl);
        loadedTexture.wrapS = RepeatWrapping;
        loadedTexture.wrapT = RepeatWrapping;
        loadedTexture.magFilter = NearestFilter;
        loadedTexture.flipY = false; // Important for GLTF textures

        const averageColor = getAverageRGB(loadedTexture.image);
        console.log("Average color from texture:", averageColor);

        gltf.scene.traverse((child: Object3D) => {
          if ((child as Mesh).isMesh) { 
            console.log("Found mesh with name:", child.name); // Log mesh name
            const material = (child as Mesh).material as MeshPhysicalMaterial;
            
            material.emissive.setRGB(0, 0, 0); 
            material.emissiveIntensity = 0; 

            if (targetMeshNames.includes(child.name)) {
              material.color.setRGB(1, 1, 1); // White base for textured part
              material.map = loadedTexture; 
              console.log(`Applying texture to ${child.name}, base color white`);
            } else {
              // For other meshes, keep original material properties
              console.log(`Keeping original material for mesh: ${child.name}`);
            }
            material.needsUpdate = true;
          }
        });
        onTextureLoaded();
      });
    } else if (gltf) {
      // If no textureUrl, traverse and log mesh names without changing materials
      gltf.scene.traverse((child: Object3D) => {
        if ((child as Mesh).isMesh) {
          console.log("Found mesh in GLTF (no texture load):", child.name); // Log mesh name
          const material = (child as Mesh).material as MeshPhysicalMaterial;
          // Keep original material properties from the GLB file
          material.needsUpdate = true;
        }
      });
       console.log("No texture URL, setting default white materials.");
       onTextureLoaded(); // Call if GLTF is loaded but no texture
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
