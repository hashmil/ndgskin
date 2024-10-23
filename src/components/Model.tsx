"use client";

import React, { useEffect, useState } from "react";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Html } from "@react-three/drei";
import { Vector3, Box3, Box3Helper, Euler, Object3D, Mesh } from "three";

type ModelProps = {
  url: string;
  scale?: number;
  position?: Vector3;
  rotation?: Euler;
};

export function Model({
  url,
  scale = 1,
  position = new Vector3(0, 0, 0),
  rotation = new Euler(0, 0, 0),
}: ModelProps) {
  const [error, setError] = useState<string | null>(null);

  const gltf = useLoader(
    GLTFLoader,
    url,
    undefined,
    (event: ProgressEvent<EventTarget>) => {
      console.error("Error loading model:", event);
      setError("Error loading model");
    }
  );

  useEffect(() => {
    if (gltf) {
      console.log("Model loaded successfully:", gltf);
      gltf.scene.traverse((child: Object3D) => {
        if ((child as Mesh).isMesh) {
          console.log("Mesh found:", child.name);
          console.log("Material:", (child as Mesh).material);
        }
      });
    }
  }, [gltf]);

  if (error) {
    return <Html center>{`Error loading model: ${error}`}</Html>;
  }

  if (!gltf) {
    return <Html center>Loading model...</Html>;
  }

  return (
    <group scale={scale} position={position} rotation={rotation}>
      <primitive object={gltf.scene} />
    </group>
  );
}
