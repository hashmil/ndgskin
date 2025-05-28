// src/app/page.tsx

"use client";

import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useHelper,
} from "@react-three/drei";
import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Vector3, Euler, PerspectiveCamera } from "three";
import * as THREE from "three";
import { AnimatedModelWrapper } from "@/components/AnimatedModelWrapper";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import PasswordProtection from "@/components/PasswordProtection";
import AnimatedPlaceholder from "@/components/AnimatedPlaceholder";
import TexturePanel from "@/components/TexturePanel";
import { Background, ParallaxTracker } from "@/components/Background";
import SimpleControls from "@/components/SimpleControls";
import { RotatableEnvironment } from "@/components/RotatableEnvironment";
import LoadingBar from "@/components/LoadingBar";
// import { Effects } from "@/components/Effects";

const ErrorBoundary = dynamic(
  () => import("react-error-boundary").then((mod) => mod.ErrorBoundary),
  { ssr: false }
);

const Effects = dynamic(
  () => import("@/components/Effects").then((mod) => mod.Effects),
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

function ToneMappingController({ exposure }: { exposure: number }) {
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);

  return null;
}

function CameraController({ settings, controlsRef }: {
  settings: {
    distance: number;
    azimuth: number;
    polar: number;
    targetX: number;
    targetY: number;
    targetZ: number;
    fov: number
  };
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (controlsRef.current) {
      // Set target
      controlsRef.current.target.set(settings.targetX, settings.targetY, settings.targetZ);

      // Calculate position from spherical coordinates
      const x = settings.distance * Math.sin(settings.polar) * Math.cos(settings.azimuth);
      const y = settings.distance * Math.cos(settings.polar);
      const z = settings.distance * Math.sin(settings.polar) * Math.sin(settings.azimuth);

      // Set camera position relative to target
      camera.position.set(
        settings.targetX + x,
        settings.targetY + y,
        settings.targetZ + z
      );

      // Update FOV
      if ((camera as PerspectiveCamera).isPerspectiveCamera) {
        (camera as PerspectiveCamera).fov = settings.fov;
        (camera as PerspectiveCamera).updateProjectionMatrix();
      }

      // Update OrbitControls
      controlsRef.current.update();
    }
  }, [camera, settings, controlsRef]);

  return null;
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
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);

  // Ref for OrbitControls
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Default lighting settings
  const defaultLightingSettings = {
    envPreset: "city",
    envBackground: false,
    envRotation: 0,
    lightIntensity: 3,
    lightPosX: 5,
    lightPosY: 5,
    lightPosZ: 5,
    lightTargetX: 0,
    lightTargetY: 0,
    lightTargetZ: 0,
    lightRadius: 1.0,
    hemisphereIntensity: 0.3,
    skyColor: "#adccec",
    groundColor: "#606060",
    toneMappingExposure: 1.0,
    bloomIntensity: 1.0,
    bloomThreshold: 0.9,
    bloomSmoothing: 0.025,
    bloomRadius: 1.0,
  };

  // Load lighting settings from localStorage or use defaults
  const [lightingSettings, setLightingSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lightingSettings');
      if (saved) {
        try {
          return { ...defaultLightingSettings, ...JSON.parse(saved) };
        } catch (e) {
          console.error('Error parsing saved lighting settings:', e);
        }
      }
    }
    return defaultLightingSettings;
  });

  const [modelSettings, setModelSettings] = useState({
    scale: 1,
    modelPosX: 0,
    modelPosY: 0,
    modelPosZ: 0,
    modelRotX: 0,
    modelRotY: Math.PI/1.45,
    modelRotZ: 0,
  });

  const [cameraSettings, setCameraSettings] = useState({
    distance: 2,
    azimuth: 0,
    polar: Math.PI / 2,
    targetX: 0,
    targetY: .8,
    targetZ: -.1,
    fov: 70,
  });

  // Save lighting settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lightingSettings', JSON.stringify(lightingSettings));
    }
  }, [lightingSettings]);

  // Check authentication status and config on component mount
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

    const checkConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const { showControls } = await response.json();
          setShowControls(showControls);
        }
      } catch (error) {
        console.error('Config check error:', error);
        setShowControls(false); // Default to false if error
      }
    };

    checkAuth();
    checkConfig();
  }, []);

  const handleGenerateSkin = async () => {
    console.log("Starting generation process");
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
  }, []);

  // Sequencing animations
  useEffect(() => {
    if (modelLoaded) {
      // Start model animation immediately
      // Wait 800ms before hiding loading bar (faster)
      setTimeout(() => {
        setIsLoadingComplete(true);
        // Wait another 300ms before showing UI (faster)
        setTimeout(() => {
          setShowUI(true);
        }, 300);
      }, 800);
    }
  }, [modelLoaded]);

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
          className="relative w-screen overflow-y-auto"
          style={{
            height: `${viewportHeight}px`,
            minHeight: "-webkit-fill-available",
          }}>
          {!lightingSettings.envBackground && <Background />}
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
              camera={{ position: [2, 1, 3], fov: 75 }}
              style={{ height: '100vh', width: '100vw' }}
              shadows
              gl={(canvas) => {
                const renderer = new THREE.WebGLRenderer({ 
                  canvas, 
                  antialias: true,
                  alpha: true,
                  powerPreference: "high-performance",
                  stencil: false,
                  depth: true,
                  logarithmicDepthBuffer: true
                });
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                // Configure proper color space for realistic rendering
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = lightingSettings.toneMappingExposure;
                // Enhanced antialiasing settings
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
                // Make canvas transparent to show background
                renderer.setClearColor(0x000000, 0);
                renderer.sortObjects = true;
                return renderer;
              }}
              onCreated={({ camera }) => {
                if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
                  console.log("Canvas created. Camera FOV:", (camera as THREE.PerspectiveCamera).fov);
                }
              }}>
              {!lightingSettings.envBackground && <ParallaxTracker />}
              <ToneMappingController exposure={lightingSettings.toneMappingExposure} />
              <CameraController settings={cameraSettings} controlsRef={controlsRef} />
              <OrbitControls
                ref={controlsRef}
                enableZoom={true}
                enablePan={true}
                enableRotate={true}
              />
              <RotatableEnvironment
                preset={lightingSettings.envPreset}
                background={lightingSettings.envBackground}
                rotation={lightingSettings.envRotation}
              />
              <ambientLight intensity={0.2} />
              <LightWithHelper
                position={new Vector3(lightingSettings.lightPosX, lightingSettings.lightPosY, lightingSettings.lightPosZ)}
                target={new Vector3(lightingSettings.lightTargetX, lightingSettings.lightTargetY, lightingSettings.lightTargetZ)}
                intensity={lightingSettings.lightIntensity}
                helperColor="red"
                showHelper={false}
              />
              <hemisphereLight
                args={[lightingSettings.skyColor, lightingSettings.groundColor, lightingSettings.hemisphereIntensity]}
              />
              <Suspense fallback={null}>
                <group scale={[-1, 1, 1]}>
                  <AnimatedModelWrapper
                    isLoaded={modelLoaded}
                    url="/Samsung S25 Ultra.glb"
                    scale={modelSettings.scale}
                    targetPosition={new Vector3(modelSettings.modelPosX, modelSettings.modelPosY, modelSettings.modelPosZ)}
                    mobilePosition={
                      new Vector3(modelSettings.modelPosX, modelSettings.modelPosY + 0.2, modelSettings.modelPosZ)
                    }
                    targetRotation={new Euler(modelSettings.modelRotX, modelSettings.modelRotY, modelSettings.modelRotZ)}
                    textureUrl={textureUrl}
                    onTextureLoaded={handleTextureLoaded}
                    onModelLoaded={() => setModelLoaded(true)}
                  />
                </group>
              </Suspense>
              <Effects
                bloomIntensity={lightingSettings.bloomIntensity}
                luminanceThreshold={lightingSettings.bloomThreshold}
                luminanceSmoothing={lightingSettings.bloomSmoothing}
                bloomRadius={lightingSettings.bloomRadius}
              />
            </Canvas>
          </ErrorBoundary>

          <div 
            className={`absolute left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-2 sm:px-4 bottom-2 sm:bottom-4 transition-all duration-1000 ease-out ${
              showUI ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            }`}>
            <div className="bg-gray-900 p-3 sm:p-4 rounded-lg border border-gray-700">
              {/* Example prompt buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 sm:mb-4">
                <div className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded p-[1px] transition-all duration-200">
                  <button
                    onClick={() => setPrompt("Minimal geometric pastels pattern")}
                    className="w-full py-2 px-3 bg-gray-800 hover:bg-gray-700 text-white text-xs sm:text-sm rounded transition-colors duration-200">
                    Geometric
                  </button>
                </div>
                <div className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded p-[1px] transition-all duration-200">
                  <button
                    onClick={() => setPrompt("Vibrant abstract leopard print")}
                    className="w-full py-2 px-3 bg-gray-800 hover:bg-gray-700 text-white text-xs sm:text-sm rounded transition-colors duration-200">
                    Animal Print
                  </button>
                </div>
                <div className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded p-[1px] transition-all duration-200">
                  <button
                    onClick={() => setPrompt("Intricate gold Art Deco")}
                    className="w-full py-2 px-3 bg-gray-800 hover:bg-gray-700 text-white text-xs sm:text-sm rounded transition-colors duration-200">
                    Art Deco
                  </button>
                </div>
              </div>
              
              {/* Input and generate button */}
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:space-x-3">
                <div className="w-full sm:flex-grow bg-gradient-to-r from-cyan-500 to-purple-500 rounded p-[1px]">
                  <div className="bg-gray-700 rounded h-full w-full">
                    <AnimatedPlaceholder
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      className="w-full py-2.5 sm:py-3 px-3 sm:px-4 bg-transparent text-white rounded focus:outline-none text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={handleGenerateSkin}
                  disabled={isGenerating}
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50 whitespace-nowrap transition-all duration-200 shadow-sm text-sm">
                  {isGenerating ? "Generating..." : "Generate skin"}
                </button>
              </div>
            </div>
          </div>

          <LoadingBar 
            isLoading={!isLoadingComplete || isGenerating} 
            message={isGenerating ? "Generating your skin" : "Loading AI Skins Generator"}
            progress={isGenerating ? undefined : (modelLoaded ? 100 : 0)}
          />

          {showControls && (
            <TexturePanel prompt={generatedPrompt} textureUrl={textureUrl} />
          )}

          {showControls && (
            <SimpleControls
              lightingSettings={lightingSettings}
              modelSettings={modelSettings}
              cameraSettings={cameraSettings}
              onLightingChange={setLightingSettings}
              onModelChange={setModelSettings}
              onCameraChange={setCameraSettings}
            />
          )}
        </div>
      )}
    </>
  );
}
