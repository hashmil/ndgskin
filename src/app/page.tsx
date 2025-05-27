// src/app/page.tsx

"use client";

import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  useHelper,
  Html,
  useProgress,
  Environment,
} from "@react-three/drei";
import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Vector3, Euler, PerspectiveCamera } from "three";
import * as THREE from "three";
import { ChangeableModel } from "@/components/ChangeableModel";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import { useLevaSettings } from "@/hooks/useLevaSettings";
import PasswordProtection from "@/components/PasswordProtection";
import AnimatedPlaceholder from "@/components/AnimatedPlaceholder";
import TexturePanel from "@/components/TexturePanel";
import { Background } from "@/components/Background";
import { useControls, folder, Leva, button } from "leva"; // Restoring Leva, useControls, folder

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

interface CameraSettings {
  posX: number;
  posY: number;
  posZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  fov: number;
  enableZoom: boolean;
  enablePan: boolean;
  enableRotate: boolean;
}

function ToneMappingController({ exposure }: { exposure: number }) {
  const { gl } = useThree();
  
  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);
  
  return null;
}

function CameraController({ 
  initialCameraSettings, 
  onCameraSettingsChange 
}: { 
  initialCameraSettings: CameraSettings; 
  onCameraSettingsChange: (settings: CameraSettings) => void; 
}) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [isUpdatingFromLeva, setIsUpdatingFromLeva] = useState(false);

  const [{ posX, posY, posZ, fov, targetX, targetY, targetZ, enableZoom, enablePan, enableRotate }, set] = useControls(
    "Camera",
    () => ({
      position: folder({
        posX: { value: initialCameraSettings.posX, min: -20, max: 20, step: 0.1 },
        posY: { value: initialCameraSettings.posY, min: -20, max: 20, step: 0.1 },
        posZ: { value: initialCameraSettings.posZ, min: -20, max: 20, step: 0.1 },
      }),
      target: folder({
        targetX: { value: initialCameraSettings.targetX, min: -10, max: 10, step: 0.1 },
        targetY: { value: initialCameraSettings.targetY, min: -10, max: 10, step: 0.1 },
        targetZ: { value: initialCameraSettings.targetZ, min: -10, max: 10, step: 0.1 },
      }),
      settings: folder({
        fov: { value: initialCameraSettings.fov, min: 10, max: 120, step: 1 },
        enableZoom: { value: initialCameraSettings.enableZoom },
        enablePan: { value: initialCameraSettings.enablePan },
        enableRotate: { value: initialCameraSettings.enableRotate },
      }),
      actions: folder({
        savePosition: button(() => {
          const currentSettings = {
            posX: camera.position.x,
            posY: camera.position.y, 
            posZ: camera.position.z,
            targetX: controlsRef.current?.target.x || 0,
            targetY: controlsRef.current?.target.y || 0,
            targetZ: controlsRef.current?.target.z || 0,
            fov, enableZoom, enablePan, enableRotate
          };
          onCameraSettingsChange(currentSettings);
          console.log('Manually saved camera position:', currentSettings);
        }),
      }),
    }),
    { collapsed: true },
    [initialCameraSettings]
  );

  // Update camera when Leva controls change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (camera instanceof PerspectiveCamera) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      
      setIsUpdatingFromLeva(true);
      camera.position.set(posX, posY, posZ);
      
      if (controlsRef.current) {
        controlsRef.current.target.set(targetX, targetY, targetZ);
        controlsRef.current.update();
      }
      
      setTimeout(() => setIsUpdatingFromLeva(false), 50);
    }, 10); // Small delay to prevent rapid updates

    return () => clearTimeout(timeoutId);
  }, [camera, posX, posY, posZ, fov, targetX, targetY, targetZ]);

  // Sync Leva with camera movement using event-based approach
  const syncLevaWithCamera = useCallback(() => {
    if (controlsRef.current && !isUpdatingFromLeva) {
      const currentPos = camera.position;
      const currentTarget = controlsRef.current.target;
      
      set({
        posX: Number(currentPos.x.toFixed(2)),
        posY: Number(currentPos.y.toFixed(2)),
        posZ: Number(currentPos.z.toFixed(2)),
        targetX: Number(currentTarget.x.toFixed(2)),
        targetY: Number(currentTarget.y.toFixed(2)),
        targetZ: Number(currentTarget.z.toFixed(2)),
      });
    }
  }, [camera, set, isUpdatingFromLeva]);

  // Auto-save camera settings when they change
  useEffect(() => {
    const cameraSettings: CameraSettings = {
      posX, posY, posZ, fov, targetX, targetY, targetZ, 
      enableZoom: Boolean(enableZoom), 
      enablePan: Boolean(enablePan), 
      enableRotate: Boolean(enableRotate)
    };
    onCameraSettingsChange(cameraSettings);
  }, [posX, posY, posZ, fov, targetX, targetY, targetZ, enableZoom, enablePan, enableRotate, onCameraSettingsChange]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={Boolean(enableZoom)}
      enablePan={Boolean(enablePan)}
      enableRotate={Boolean(enableRotate)}
      onChange={syncLevaWithCamera}
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
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const { loadSettings, saveSettings } = useLevaSettings();

  // Initialize settings from database
  const [initialLightingSettings, setInitialLightingSettings] = useState({
    envPreset: "studio",
    envBackground: false,
    lightIntensity: 0.5,
    lightPosX: 5,
    lightPosY: 5,
    lightPosZ: 5,
    lightTargetX: 0,
    lightTargetY: 0,
    lightTargetZ: 0,
    hemisphereIntensity: 0.3,
    skyColor: "#adccec",
    groundColor: "#606060",
    toneMappingExposure: 1.0,
  });

  // Leva controls for Lighting
  const {
    lightIntensity,
    lightPosX,
    lightPosY,
    lightPosZ,
    lightTargetX,
    lightTargetY,
    lightTargetZ,
    hemisphereIntensity,
    skyColor,
    groundColor,
    envPreset,
    envBackground,
    toneMappingExposure,
  } = useControls(
    "Lighting",
    {
      environment: folder({
        envPreset: { 
          value: initialLightingSettings.envPreset, 
          options: ["sunset", "dawn", "night", "warehouse", "forest", "apartment", "studio", "city", "park", "lobby"]
        },
        envBackground: { value: initialLightingSettings.envBackground },
      }),
      directionalLight: folder({
        lightIntensity: { value: initialLightingSettings.lightIntensity, min: 0, max: 3, step: 0.1 },
        lightPosX: { value: initialLightingSettings.lightPosX, min: -10, max: 10, step: 0.1 },
        lightPosY: { value: initialLightingSettings.lightPosY, min: -10, max: 10, step: 0.1 },
        lightPosZ: { value: initialLightingSettings.lightPosZ, min: -10, max: 10, step: 0.1 },
        lightTargetX: { value: initialLightingSettings.lightTargetX, min: -5, max: 5, step: 0.1 },
        lightTargetY: { value: initialLightingSettings.lightTargetY, min: -5, max: 5, step: 0.1 },
        lightTargetZ: { value: initialLightingSettings.lightTargetZ, min: -5, max: 5, step: 0.1 },
      }),
      hemisphereLight: folder({
        hemisphereIntensity: { value: initialLightingSettings.hemisphereIntensity, min: 0, max: 2, step: 0.1 },
        skyColor: { value: initialLightingSettings.skyColor },
        groundColor: { value: initialLightingSettings.groundColor },
      }),
      toneMapping: folder({
        toneMappingExposure: { value: initialLightingSettings.toneMappingExposure, min: 0.1, max: 3.0, step: 0.1 },
      }),
    },
    { collapsed: true },
    [initialLightingSettings] // Re-run when initial settings change
  );

  // Initialize model settings from database
  const [initialModelSettings, setInitialModelSettings] = useState({
    scale: 1,
    modelPosX: 0,
    modelPosY: 0,
    modelPosZ: 0,
    modelRotX: 0,
    modelRotY: 0,
    modelRotZ: 0,
  });

  // Initialize camera settings from database - better defaults for phone model
  const [initialCameraSettings, setInitialCameraSettings] = useState({
    posX: 2,
    posY: 1,
    posZ: 3,
    targetX: 0,
    targetY: 0,
    targetZ: 0,
    fov: 75,
    enableZoom: true,
    enablePan: true,
    enableRotate: true,
  });

  // Leva controls for Model Transform
  const {
    scale,
    modelPosX,
    modelPosY,
    modelPosZ,
    modelRotX,
    modelRotY,
    modelRotZ,
  } = useControls(
    "Model Transform",
    {
      scale: { value: initialModelSettings.scale, min: 0.1, max: 10, step: 0.1 },
      position: folder({
        modelPosX: { value: initialModelSettings.modelPosX, min: -10, max: 10, step: 0.1 },
        modelPosY: { value: initialModelSettings.modelPosY, min: -10, max: 10, step: 0.1 },
        modelPosZ: { value: initialModelSettings.modelPosZ, min: -10, max: 10, step: 0.1 },
      }),
      rotation: folder({
        modelRotX: { value: initialModelSettings.modelRotX, min: -Math.PI, max: Math.PI, step: 0.01 },
        modelRotY: { value: initialModelSettings.modelRotY, min: -Math.PI, max: Math.PI, step: 0.01 },
        modelRotZ: { value: initialModelSettings.modelRotZ, min: -Math.PI, max: Math.PI, step: 0.01 },
      }),
    },
    { collapsed: true },
    [initialModelSettings]
  );

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check localStorage first for immediate UX
        const localAuth = localStorage.getItem('authenticated');
        if (localAuth === 'true') {
          // Verify with server to ensure cookie is still valid
          const response = await fetch('/api/auth/status');
          if (response.ok) {
            const { authenticated } = await response.json();
            setIsAuthenticated(authenticated);
          }
        }
      } catch (error) {
        console.error('Authentication check error:', error);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  // Load settings on component mount (only after auth is checked)
  useEffect(() => {
    if (!authChecked) return;
    
    const initializeSettings = async () => {
      try {
        const settings = await loadSettings();
        
        if (settings.lighting) {
          setInitialLightingSettings(prev => ({ ...prev, ...settings.lighting }));
        }
        
        if (settings.model) {
          setInitialModelSettings(prev => ({ ...prev, ...settings.model }));
        }
        
        if (settings.camera) {
          console.log('Loading camera settings from database:', settings.camera);
          setInitialCameraSettings(prev => ({ ...prev, ...settings.camera }));
        } else {
          console.log('No camera settings found in database, using defaults');
        }
        
        setSettingsLoaded(true);
        console.log('All settings loaded from database:', settings);
      } catch (error) {
        console.error('Failed to load settings:', error);
        setSettingsLoaded(true); // Still set to true to show controls
      }
    };

    if (isAuthenticated) {
      initializeSettings();
    }
  }, [loadSettings, authChecked, isAuthenticated]);

  // Auto-save lighting settings when they change
  useEffect(() => {
    if (settingsLoaded) {
      const lightingSettings = {
        envPreset,
        envBackground,
        lightIntensity,
        lightPosX,
        lightPosY,
        lightPosZ,
        lightTargetX,
        lightTargetY,
        lightTargetZ,
        hemisphereIntensity,
        skyColor,
        groundColor,
        toneMappingExposure,
      };
      saveSettings('lighting', lightingSettings);
    }
  }, [
    settingsLoaded, envPreset, envBackground, lightIntensity, lightPosX, lightPosY, 
    lightPosZ, lightTargetX, lightTargetY, lightTargetZ, hemisphereIntensity, 
    skyColor, groundColor, toneMappingExposure, saveSettings
  ]);

  // Auto-save model settings when they change
  useEffect(() => {
    if (settingsLoaded) {
      const modelSettings = {
        scale,
        modelPosX,
        modelPosY,
        modelPosZ,
        modelRotX,
        modelRotY,
        modelRotZ,
      };
      saveSettings('model', modelSettings);
    }
  }, [settingsLoaded, scale, modelPosX, modelPosY, modelPosZ, modelRotX, modelRotY, modelRotZ, saveSettings]);

  // Handle camera settings changes
  const handleCameraSettingsChange = useCallback((cameraSettings: CameraSettings) => {
    if (settingsLoaded) {
      saveSettings('camera', cameraSettings);
    }
  }, [settingsLoaded, saveSettings]);

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

  // Show loading while checking authentication
  if (!authChecked) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

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
              camera={{ position: [0, 0, 5], fov: 40 }}
              style={{ height: '100vh', width: '100vw' }}
              shadows
              gl={(canvas) => {
                const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                // Configure proper color space for realistic rendering
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = 1.0;
                return renderer;
              }}
              onCreated={({ camera }) => {
                if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
                  console.log("Canvas created. Camera FOV:", (camera as THREE.PerspectiveCamera).fov);
                }
              }}>
              <Background />
              <ToneMappingController exposure={toneMappingExposure} />
              <CameraController 
                initialCameraSettings={initialCameraSettings}
                onCameraSettingsChange={handleCameraSettingsChange}
              />
              <Environment 
                preset={envPreset as any}
                background={envBackground}
              />
              <ambientLight intensity={0.2} /> 
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
                  url="/Samsung S25 Ultra.glb"
                  scale={scale}
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
            <Leva hidden={false} /> {/* Show Leva panel for camera and lighting controls */}
          </div>
        </div>
      )}
    </>
  );
}
