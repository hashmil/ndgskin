// src/app/page.tsx

"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, useHelper } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useControls, folder, Leva, useCreateStore } from "leva";
import { Vector3, Euler, PerspectiveCamera } from "three";
import * as THREE from "three";
import { ChangeableModel } from "@/components/ChangeableModel";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import PasswordProtection from "@/components/PasswordProtection";

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
  const [isLoadingTexture, setIsLoadingTexture] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const store = useCreateStore();
  const viewportHeight = useViewportHeight();
  const [showSpinner, setShowSpinner] = useState(false);
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
    console.log("Starting generation process");
    setIsGenerating(true);
    setShowSpinner(true);
    console.log("Spinner should be visible now");

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

      // After successfully generating the texture URL
      setTextureUrl(generatedTextureUrl);
      console.log("Texture URL set, waiting for texture to load");
    } catch (error: any) {
      console.error("Error generating skin:", error);
      setShowSpinner(false);
      console.log("Spinner hidden due to error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleGenerateSkin();
    }
  };

  const handleTextureLoaded = useCallback(() => {
    console.log("Texture loaded and applied");
    setIsLoading(false);
    setShowSpinner(false);
    console.log("Spinner should be hidden now");
  }, []);

  console.log("Current showSpinner state:", showSpinner);

  return (
    <>
      {!isAuthenticated ? (
        <PasswordProtection
          onCorrectPassword={() => setIsAuthenticated(true)}
        />
      ) : (
        <div
          className="relative w-screen overflow-hidden bg-black"
          style={{ height: `calc(var(--vh, 1vh) * 100)` }}>
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between z-10">
            <img
              src="/lionx_logo.png"
              alt="LionX Logo"
              className="h-12 object-contain"
            />
            <img
              src="/ndg_logo.png"
              alt="NDG Logo"
              className="h-12 object-contain"
            />
          </div>
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
                  position={new Vector3(modelPosX, modelPosY, modelPosZ)}
                  mobilePosition={
                    new Vector3(modelPosX, modelPosY + 0.5, modelPosZ)
                  }
                  rotation={new Euler(modelRotX, modelRotY, modelRotZ)}
                  textureUrl={textureUrl}
                  onTextureLoaded={handleTextureLoaded}
                  isLoadingTexture={isLoading}
                />
              </Suspense>
            </Canvas>
          </ErrorBoundary>

          <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-4 bottom-2 sm:bottom-5">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Describe your pattern"
                className="w-full sm:flex-grow py-3 px-4 bg-gray-200 text-black rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleGenerateSkin}
                disabled={isGenerating || isLoading}
                className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 whitespace-nowrap">
                {isGenerating ? "Generating..." : "Generate skin"}
              </button>
            </div>
          </div>

          {showSpinner && (
            <div className="loading-spinner-container">
              <div className="loading-spinner"></div>
            </div>
          )}

          <Leva hidden />
        </div>
      )}
    </>
  );
}
