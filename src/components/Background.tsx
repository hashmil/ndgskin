import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Color } from "three";

export function Background() {
  const { scene } = useThree();

  useEffect(() => {
    // Set a very dark background color
    scene.background = new Color(0x0a0a0a); // Very dark gray, almost black
  }, [scene]);

  return null;
}
