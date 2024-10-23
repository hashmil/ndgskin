"use client";

import React, { useEffect, useState } from "react";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Html, useProgress } from "@react-three/drei";
import { Vector3, Euler, Object3D, Mesh } from "three";

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
  const { progress } = useProgress();

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
    return (
      <Html center>
        <div className="flex flex-col items-center justify-center">
          <div className="text-white text-lg font-bold mb-2">
            {Math.round(progress)}%
          </div>
          <div className="w-24 h-1 bg-gray-700 rounded-full">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Html>
    );
  }

  return (
    <group scale={scale} position={position} rotation={rotation}>
      <primitive object={gltf.scene} />
    </group>
  );
}
