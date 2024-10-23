import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { TextureLoader, LinearFilter } from "three";

export function Background() {
  const { scene } = useThree();

  useEffect(() => {
    const loader = new TextureLoader();
    loader.load("/bg.jpg", (texture) => {
      texture.minFilter = LinearFilter;
      texture.magFilter = LinearFilter;
      scene.background = texture;
    });
  }, [scene]);

  return null;
}
