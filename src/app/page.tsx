// src/app/page.tsx

"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useControls, folder, Leva, useCreateStore } from "leva";
import { Vector3, Euler, PerspectiveCamera } from "three";
import * as THREE from "three";
import { ChangeableModel } from "@/components/ChangeableModel";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

const ErrorBoundary = dynamic(
  () => import("react-error-boundary").then((mod) => mod.ErrorBoundary),
  { ssr: false }
);

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
    </div>
  );
}

function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const { posX, posY, posZ, rotX, rotY, rotZ, zoom, fov, height } = useControls(
    "Camera",
    {
      position: folder({
        posX: { value: -4.8, min: -20, max: 20, step: 0.1 },
        posY: { value: 3.1, min: -20, max: 20, step: 0.1 },
        posZ: { value: 13.5, min: -20, max: 20, step: 0.1 },
      }),
      rotation: folder({
        rotX: { value: -0.2, min: -Math.PI, max: Math.PI, step: 0.01 },
        rotY: { value: -0.3, min: -Math.PI, max: Math.PI, step: 0.01 },
        rotZ: { value: 0.0, min: -Math.PI, max: Math.PI, step: 0.01 },
      }),
      zoom: { value: 23.3, min: 0.1, max: 50, step: 0.1 },
      fov: { value: 11, min: 10, max: 100, step: 1 },
      height: { value: 1.0, min: -10, max: 20, step: 0.1 },
    },
    { collapsed: true }
  );

  useEffect(() => {
    if (camera && controlsRef.current) {
      if (camera instanceof PerspectiveCamera) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }

      const direction = new Vector3(posX, posY, posZ).normalize();
      const distance = zoom;
      const newPosition = new Vector3(0, height, 0).add(
        direction.multiplyScalar(distance)
      );

      camera.position.copy(newPosition);
      controlsRef.current.object.position.copy(newPosition);
      controlsRef.current.target.set(0, height, 0);
      controlsRef.current.update();
    }
  }, [camera, posX, posY, posZ, rotX, rotY, rotZ, zoom, fov, height]);

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera as PerspectiveCamera]}
      enableZoom={true}
      zoomSpeed={0.5}
      enablePan={true}
      panSpeed={0.5}
      enableRotate={true}
      rotateSpeed={0.5}
      minDistance={0.1}
      maxDistance={100}
      target={new Vector3(0, height, 0)}
    />
  );
}

interface LightWithHelperProps {
  position: Vector3;
  target: Vector3;
  intensity: number;
}

function LightWithHelper({
  position,
  target,
  intensity,
}: LightWithHelperProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);

  return (
    <>
      <directionalLight
        ref={lightRef}
        position={position}
        intensity={intensity}
        castShadow
        target={targetRef.current || undefined}
      />
      <object3D ref={targetRef} position={target} />
    </>
  );
}

export default function Home() {
  const [modelPosition, setModelPosition] = useState(new Vector3(0, 0, 0));
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTextureUrl, setGeneratedTextureUrl] = useState<string | null>(
    null
  );
  const store = useCreateStore();

  const {
    modelScale,
    modelPosX,
    modelPosY,
    modelPosZ,
    modelRotX,
    modelRotY,
    modelRotZ,
  } = useControls(
    "Model",
    {
      modelScale: { value: 0.6, min: 0.1, max: 5, step: 0.1 },
      position: folder({
        modelPosX: { value: 0.0, min: -10, max: 10, step: 0.1 },
        modelPosY: { value: 0.1, min: -10, max: 10, step: 0.1 },
        modelPosZ: { value: -0.0, min: -10, max: 10, step: 0.1 },
      }),
      rotation: folder({
        modelRotX: { value: 0.0, min: 0, max: Math.PI * 2, step: 0.1 },
        modelRotY: { value: 0.3, min: 0, max: Math.PI * 2, step: 0.1 },
        modelRotZ: { value: 0.0, min: 0, max: Math.PI * 2, step: 0.1 },
      }),
    },
    { store }
  );

  const {
    lightPosX,
    lightPosY,
    lightPosZ,
    lightTargetX,
    lightTargetY,
    lightTargetZ,
    lightIntensity,
  } = useControls(
    "Light",
    {
      position: folder({
        lightPosX: { value: 1.3, min: -10, max: 10, step: 0.1 },
        lightPosY: { value: 2.1, min: -10, max: 10, step: 0.1 },
        lightPosZ: { value: 1.8, min: -10, max: 10, step: 0.1 },
      }),
      target: folder({
        lightTargetX: { value: 0.0, min: -10, max: 10, step: 0.1 },
        lightTargetY: { value: -0.1, min: -10, max: 10, step: 0.1 },
        lightTargetZ: { value: 0.0, min: -10, max: 10, step: 0.1 },
      }),
      lightIntensity: { value: 3.4, min: 0, max: 10, step: 0.1 },
    },
    { store }
  );

  useEffect(() => {
    setModelPosition(new Vector3(modelPosX, modelPosY, modelPosZ));
  }, [modelPosX, modelPosY, modelPosZ]);

  const handleGenerateSkin = async () => {
    setIsGenerating(true);
    try {
      // Step 1: Use OpenAI to convert user input to a seamless pattern prompt
      const openAIResponse = await fetch("/api/generatePrompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: prompt }),
      });
      const { seamlessPatternPrompt } = await openAIResponse.json();
      console.log(
        "Using seamless pattern prompt for FAL AI:",
        seamlessPatternPrompt
      );

      // Step 2: Send request to FAL AI to generate texture
      const falResponse = await fetch("/api/generateTexture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: seamlessPatternPrompt,
          seed: 6252023, // Optionally pass a seed value
        }),
      });

      if (!falResponse.ok) {
        const errorData = await falResponse.json();
        throw new Error(errorData.error || "Failed to generate texture");
      }

      const { images } = await falResponse.json();

      if (!images || images.length === 0) {
        throw new Error("No images returned from FAL AI");
      }

      const generatedTextureUrl = images[0].url;
      console.log("Generated texture URL:", generatedTextureUrl);

      // Update the state with the new texture URL
      setGeneratedTextureUrl(generatedTextureUrl);
    } catch (error: any) {
      console.error("Error generating skin:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Canvas
          className="!absolute top-0 left-0 w-full h-full"
          style={{ background: "#464646" }}>
          <CameraController />
          <ambientLight intensity={0.5} />
          <LightWithHelper
            position={new Vector3(lightPosX, lightPosY, lightPosZ)}
            target={new Vector3(lightTargetX, lightTargetY, lightTargetZ)}
            intensity={lightIntensity}
          />
          <Suspense fallback={null}>
            <ChangeableModel
              url="/NDG_v1.glb"
              scale={modelScale}
              position={modelPosition}
              rotation={new Euler(modelRotX, modelRotY, modelRotZ)}
              textureUrl={generatedTextureUrl} // Pass the generated texture URL
            />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
      <div
        className="absolute left-1/2 transform -translate-x-1/2 
                   bottom-24 sm:bottom-28 md:bottom-32 lg:bottom-36
                   bg-white text-white font-bold py-2 px-4 rounded
                   shadow-lg transition duration-300 ease-in-out z-10">
        <input
          type="text"
          placeholder="Describe your pattern"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="px-4 py-2 border rounded"
        />
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded shadow-lg transition duration-300 ease-in-out"
          onClick={handleGenerateSkin}
          disabled={isGenerating} // Disable button while generating
        >
          {isGenerating ? "Generating..." : "Generate Skin"}
        </button>
      </div>
      <Leva hidden />
    </div>
  );
}
