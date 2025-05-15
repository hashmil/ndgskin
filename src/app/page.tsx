// src/app/page.tsx

"use client";

import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  useHelper,
  Html,
  useProgress,
} from "@react-three/drei";
import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Vector3, Euler, PerspectiveCamera } from "three";
import * as THREE from "three";
import { ChangeableModel } from "@/components/ChangeableModel";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import PasswordProtection from "@/components/PasswordProtection";
import AnimatedPlaceholder from "@/components/AnimatedPlaceholder";
import TexturePanel from "@/components/TexturePanel";
import { Background } from "@/components/Background";
import { useControls, folder, Leva } from "leva"; // Restoring Leva, useControls, folder

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

  const { posX, posY, posZ, rotX, rotY, rotZ, zoom, height, fov } = useControls(
    "Camera",
    {
      position: folder({
        posX: { value: -0.9, min: -20, max: 20, step: 0.1 },
        posY: { value: 1.6, min: -20, max: 20, step: 0.1 },
        posZ: { value: 9.9, min: -20, max: 20, step: 0.1 },
      }),
      rotation: folder({
        rotX: { value: -0.8, min: -Math.PI, max: Math.PI, step: 0.01 },
        rotY: { value: 0.66, min: -Math.PI, max: Math.PI, step: 0.01 },
        rotZ: { value: 0.52, min: -Math.PI, max: Math.PI, step: 0.01 },
      }),
      zoom: { value: 39.5, min: 0.1, max: 50, step: 0.1 },
      height: { value: 12.5, min: -10, max: 20, step: 0.1 },
      fov: { value: 86, min: 10, max: 120, step: 1 },
    },
    { collapsed: true }
  );

  useEffect(() => {
    if (camera && controlsRef.current) {
      const isMobile = window.innerWidth < 640;

      if (camera instanceof PerspectiveCamera) {
        camera.fov = fov;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }

      const direction = new Vector3(posX, posY, posZ).normalize();
      const distance = isMobile ? zoom : zoom;
      const newPosition = new Vector3(
        0,
        isMobile ? height : height,
        0
      ).add(direction.multiplyScalar(distance));

      camera.position.copy(newPosition);
      controlsRef.current.object.position.copy(newPosition);
      controlsRef.current.target.set(0, isMobile ? height : height, 0);
      controlsRef.current.update();
    }
  }, [camera, posX, posY, posZ, rotX, rotY, rotZ, zoom, height, fov]);

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera as PerspectiveCamera]}
      enableZoom={false}
      enablePan={false}
      enableRotate={true}
      rotateSpeed={0.5}
      minDistance={zoom}
      maxDistance={zoom}
      target={new Vector3(0, height, 0)}
    />
  );
}

interface LightWithHelperProps {
  position: Vector3;
  target: Vector3;
  intensity: number;
  helperColor?: string;
  showHelper?: boolean;
}

// Internal component to encapsulate the helper logic
function DirectionalLightHelperComponent({ lightRef, helperColor }: {
  lightRef: React.MutableRefObject<THREE.DirectionalLight>;
  helperColor?: string;
}) {
  useHelper(lightRef, THREE.DirectionalLightHelper, 1, helperColor || 'grey');
  return null; // This component only adds the helper, doesn't render visuals itself
}

function LightWithHelper({
  position,
  target, // This is the desired world position for the target
  intensity,
  helperColor,
  showHelper = true,
}: LightWithHelperProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null!); 
  const { scene } = useThree(); // Get the scene object

  useEffect(() => {
    if (lightRef.current) {
      // Create a new Object3D for the target if it doesn't exist or isn't default
      // By default, a new DirectionalLight creates its own target at (0,0,0)
      // We want to control its position based on the 'target' prop.
      const lightInstance = lightRef.current;
      
      // Ensure the light's default target is added to the scene
      // if it's not already and update its position.
      // Three.js DirectionalLight creates a light.target automatically.
      if (!lightInstance.target.parent) { // Check if target is not in the scene
        scene.add(lightInstance.target);
      }
      lightInstance.target.position.copy(target);
      lightInstance.target.updateMatrixWorld(); // Crucial for the light to aim correctly
    }
    // Cleanup: remove target from scene if this light component unmounts
    // and the target was specifically added by it.
    // However, DirectionalLight's target is often managed by the light itself.
    // If we add it, we should remove it.
    return () => {
      if (lightRef.current && lightRef.current.target.parent === scene) {
        // scene.remove(lightRef.current.target); // Be cautious with default target removal
      }
    };
  }, [scene, target]); // Re-run if scene or target position changes

  // Update target position dynamically if 'target' prop changes
  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.target.position.copy(target);
      lightRef.current.target.updateMatrixWorld();
    }
  });

  return (
    <>
      <directionalLight
        ref={lightRef}
        position={position}
        intensity={intensity}
        castShadow
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        // The 'target' prop of r3f <directionalLight> tries to find an object by name/ref
        // or uses the default. We are now managing it manually via useEffect/useFrame.
        // So, we don't explicitly set target here anymore to avoid conflicts with manual setup.
      />
      {showHelper && <DirectionalLightHelperComponent lightRef={lightRef} helperColor={helperColor} />}
    </>
  );
}

export default function Home() {
  const [modelPosition, setModelPosition] = useState(new Vector3(0, 0, 0));
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingTexture, setIsLoadingTexture] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);

  // Leva controls for Lighting removed - using default/placeholder values
  const lightIntensity = 1.0;
  const lightPosX = 5;
  const lightPosY = 5;
  const lightPosZ = 5;
  const lightTargetX = 0;
  const lightTargetY = 0;
  const lightTargetZ = 0;
  const hemisphereIntensity = 0.6;
  const skyColor = "#adccec";
  const groundColor = "#606060";

  // Leva controls for Model Transform removed - using default/placeholder values
  const modelScale = 12;
  const modelPosX = 0;
  const modelPosY = -1;
  const modelPosZ = 0;
  const modelRotX = 0;
  const modelRotY = 0;
  const modelRotZ = 0;

  useEffect(() => {
    setModelPosition(new Vector3(modelPosX, modelPosY, modelPosZ));
  }, [modelPosX, modelPosY, modelPosZ]);

  const handleGenerateSkin = async () => {
    console.log("Starting generation process");
    setIsGenerating(true);
    setShowSpinner(true);
    setIsLoading(true); 
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
      setGeneratedPrompt(seamlessPatternPrompt); 

      // Step 2: Send request to FAL AI to generate texture
      const falResponse = await fetch("/api/generateTexture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: seamlessPatternPrompt,
          // seed: 6252023, // Optionally pass a seed value
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

      setTextureUrl(generatedTextureUrl);
      console.log("Texture URL set, waiting for texture to load");
    } catch (error: any) {
      console.error("Error generating skin:", error);
      setShowSpinner(false);
      setIsLoading(false); 
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

  // console.log("Current showSpinner state:", showSpinner);

  // Make sure this line is present
  const viewportHeight = useViewportHeight();

  return (
    <>
      {!isAuthenticated ? (
        <PasswordProtection
          onCorrectPassword={() => setIsAuthenticated(true)}
        />
      ) : (
        // Update this div to use the viewportHeight
        <div
          className="relative w-screen bg-black overflow-y-auto"
          style={{
            height: `${viewportHeight}px`,
            minHeight: "-webkit-fill-available",
          }}>
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between z-10">
            <img
              src="/lionx_logo.png"
              alt="LionX Logo"
              className="h-12 object-contain"
            />
          </div>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Canvas
              className="!absolute top-0 left-0 w-full h-full"
              camera={{ position: [0, 0, 5], fov: 40 }} // Ensured fov: 40 is here
              style={{ height: '100vh', width: '100vw' }}
              onCreated={({ gl, scene, camera }) => {
                if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
                  console.log("Canvas created. Camera FOV:", (camera as THREE.PerspectiveCamera).fov);
                }
              }}>
              <Background />
              <CameraController />
              <ambientLight intensity={0.5} /> 
              <LightWithHelper
                position={new Vector3(lightPosX, lightPosY, lightPosZ)}
                target={new Vector3(lightTargetX, lightTargetY, lightTargetZ)}
                intensity={lightIntensity}
                helperColor="red"
                showHelper={false}
              /> 
              <hemisphereLight 
                args={[skyColor, groundColor, hemisphereIntensity]}
              />
              <Suspense
                fallback={
                  <Html center>
                    <div
                      style={{
                        position: "fixed",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100vh", // Ensure it takes full viewport height
                      }}>
                      <div className="loading-spinner"></div>
                    </div>
                  </Html>
                }>
                <ChangeableModel
                  url="/bottle.glb" // Updated URL
                  scale={modelScale}
                  position={new Vector3(modelPosX, modelPosY, modelPosZ)}
                  mobilePosition={
                    new Vector3(modelPosX, modelPosY + 0.2, modelPosZ)
                  }
                  rotation={new Euler(modelRotX, modelRotY, modelRotZ)}
                  textureUrl={textureUrl}
                  onTextureLoaded={handleTextureLoaded}
                  isLoadingTexture={isLoading}
                />
              </Suspense>
            </Canvas>
          </ErrorBoundary>

          <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-4 bottom-4 sm:bottom-5">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <AnimatedPlaceholder
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleInputKeyDown}
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

          <TexturePanel prompt={generatedPrompt} textureUrl={textureUrl} />
          <div className="absolute top-4 left-4 z-10">
            <Leva hidden={true} /> {/* Restore Leva panel */}
          </div>
        </div>
      )}
    </>
  );
}
