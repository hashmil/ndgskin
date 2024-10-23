import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { PerspectiveCamera, Vector3 } from "three";
import { OrbitControls } from "@react-three/drei";
import { useControls, folder } from "leva";

export function CameraController() {
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
      const isMobile = window.innerWidth < 640;

      if (camera instanceof PerspectiveCamera) {
        camera.fov = isMobile ? fov : fov;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }

      const direction = new Vector3(posX, posY, posZ).normalize();
      const distance = isMobile ? zoom : zoom;
      const newPosition = new Vector3(0, isMobile ? height : height, 0).add(
        direction.multiplyScalar(distance)
      );

      camera.position.copy(newPosition);
      controlsRef.current.object.position.copy(newPosition);
      controlsRef.current.target.set(0, isMobile ? height : height, 0);
      controlsRef.current.update();
    }
  }, [camera, posX, posY, posZ, rotX, rotY, rotZ, zoom, fov, height]);

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera as PerspectiveCamera]}
      enableZoom={false}
      enablePan={true}
      panSpeed={0.5}
      enableRotate={true}
      rotateSpeed={0.5}
      minDistance={zoom}
      maxDistance={zoom}
      target={new Vector3(0, height, 0)}
    />
  );
}
