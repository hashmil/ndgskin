import { useThree } from "@react-three/fiber";
import { useCallback, useEffect } from "react";

interface SceneProps {
  onCaptureReady: (captureFunction: () => string) => void;
}

export function Scene({ onCaptureReady }: SceneProps) {
  const { gl: renderer, scene, camera } = useThree();

  const captureScene = useCallback(() => {
    renderer.render(scene, camera);
    return renderer.domElement.toDataURL("image/png");
  }, [renderer, scene, camera]);

  // Provide the capture function to the parent
  useEffect(() => {
    onCaptureReady(captureScene);
  }, [onCaptureReady, captureScene]);

  return null;
}
