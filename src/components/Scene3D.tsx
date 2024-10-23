import { Canvas, useThree } from "@react-three/fiber";
import { useCallback, useEffect } from "react";
import { Vector3, Euler } from "three";
import { CameraController } from "./CameraController";
import { ChangeableModel } from "./ChangeableModel";

function CaptureHandler({
  onCaptureReady,
}: {
  onCaptureReady: (capture: () => string) => void;
}) {
  const { gl: renderer, scene, camera } = useThree();

  const captureScene = useCallback(() => {
    renderer.render(scene, camera);
    return renderer.domElement.toDataURL("image/png");
  }, [renderer, scene, camera]);

  useEffect(() => {
    onCaptureReady(captureScene);
  }, [onCaptureReady, captureScene]);

  return null;
}

interface Scene3DProps {
  textureUrl: string | null;
  isLoadingTexture: boolean;
  onTextureLoaded: () => void;
  onCaptureReady: (capture: () => string) => void;
  modelPath: string;
}

export default function Scene3D({
  textureUrl,
  isLoadingTexture,
  onTextureLoaded,
  onCaptureReady,
  modelPath,
}: Scene3DProps) {
  return (
    <Canvas>
      <CameraController />
      <ambientLight intensity={1.5} />
      <pointLight position={[10, 10, 10]} />
      <ChangeableModel
        url={modelPath}
        scale={1}
        position={new Vector3(-4.8, 3.1, 13.5)}
        mobilePosition={new Vector3(-4.8, 3.1, 13.5)}
        rotation={new Euler(0, 0, 0)}
        textureUrl={textureUrl}
        isLoadingTexture={isLoadingTexture}
        onTextureLoaded={onTextureLoaded}
      />
      <CaptureHandler onCaptureReady={onCaptureReady} />
    </Canvas>
  );
}
