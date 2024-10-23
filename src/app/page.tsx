"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, useHelper } from "@react-three/drei";
import { Model } from "@/components/Model";
import { Suspense, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useControls, folder, button, Leva, useCreateStore } from "leva";
import { Vector3, Euler } from "three";
import { DirectionalLight, DirectionalLightHelper } from "three";
import { ChangeableModel } from "@/components/ChangeableModel";

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
  const controlsRef = useRef<OrbitControls>();

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
      // Set camera properties
      camera.fov = fov;
      camera.updateProjectionMatrix();

      // Calculate camera position based on zoom
      const direction = new Vector3(posX, posY, posZ).normalize();
      const distance = zoom;
      const newPosition = new Vector3(0, height, 0).add(
        direction.multiplyScalar(distance)
      );

      // Update camera and controls
      camera.position.copy(newPosition);
      controlsRef.current.object.position.copy(newPosition);
      controlsRef.current.target.set(0, height, 0);
      controlsRef.current.update();
    }
  }, [camera, posX, posY, posZ, rotX, rotY, rotZ, zoom, fov, height]);

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, camera.domElement]}
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

function LightWithHelper({ position, target, intensity }) {
  const lightRef = useRef<DirectionalLight>();
  const targetRef = useRef<THREE.Object3D>();
  // Remove this line:
  // useHelper(lightRef, DirectionalLightHelper, 1, "red");

  return (
    <>
      <directionalLight
        ref={lightRef}
        position={position}
        intensity={intensity}
        castShadow
        target={targetRef.current}
      />
      <object3D ref={targetRef} position={target} />
    </>
  );
}

export default function Home() {
  const [modelPosition, setModelPosition] = useState(new Vector3(0, 0.1, -0.0));
  const [currentSkin, setCurrentSkin] = useState(0);
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

  const handleChangeSkin = () => {
    setCurrentSkin((prev) => (prev + 1) % 6); // Cycle through 6 skins
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
            position={[lightPosX, lightPosY, lightPosZ]}
            target={[lightTargetX, lightTargetY, lightTargetZ]}
            intensity={lightIntensity}
          />
          <Suspense fallback={null}>
            <ChangeableModel
              url="/NDG_v1.glb"
              scale={modelScale}
              position={modelPosition}
              rotation={new Euler(modelRotX, modelRotY, modelRotZ)}
              currentSkin={currentSkin}
            />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
      <button
        className="absolute left-1/2 transform -translate-x-1/2 bottom-8 
                   bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded
                   shadow-lg transition duration-300 ease-in-out z-10"
        onClick={handleChangeSkin}>
        Change Skin
      </button>
      <Leva hidden store={store} />
    </div>
  );
}
