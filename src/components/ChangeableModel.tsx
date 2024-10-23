import React, { useEffect, useState } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
  Mesh,
  MeshStandardMaterial,
  Vector3,
  Euler,
  TextureLoader,
  RepeatWrapping,
  NearestFilter,
  Texture,
  Object3D,
} from "three";

type ChangeableModelProps = {
  url: string;
  scale?: number;
  position?: Vector3;
  rotation?: Euler;
  currentSkin: number;
};

const targetMeshNames = [
  "base-bottom",
  "base-main",
  "base-top",
  "main-section",
];

const textureUrls = [
  "/assets/pattern_01.png",
  "/assets/pattern_02.png",
  "/assets/pattern_03.png",
  "/assets/pattern_04.png",
  "/assets/pattern_05.png",
  "/assets/pattern_06.png",
];

export function ChangeableModel({
  url,
  scale = 1,
  position = new Vector3(0, 0, 0),
  rotation = new Euler(0, 0, 0),
  currentSkin,
}: ChangeableModelProps) {
  const gltf = useLoader(GLTFLoader, url);
  const [targetMeshes, setTargetMeshes] = useState<Mesh[]>([]);
  const [textures, setTextures] = useState<Texture[]>([]);
  const { gl } = useThree();

  useEffect(() => {
    const loader = new TextureLoader();
    Promise.all(
      textureUrls.map(
        (url) =>
          new Promise<Texture>((resolve, reject) => {
            loader.load(
              url,
              (texture) => {
                texture.wrapS = texture.wrapT = RepeatWrapping;
                texture.minFilter = texture.magFilter = NearestFilter;
                texture.repeat.set(1, 1); // Adjust this value if needed
                resolve(texture);
              },
              undefined,
              reject
            );
          })
      )
    )
      .then((loadedTextures) => {
        console.log("All textures loaded successfully", loadedTextures);
        setTextures(loadedTextures);
      })
      .catch((error) => {
        console.error("Error loading textures:", error);
      });
  }, []);

  useEffect(() => {
    if (gltf) {
      const meshes: Mesh[] = [];
      gltf.scene.traverse((child: Object3D) => {
        if ((child as Mesh).isMesh && targetMeshNames.includes(child.name)) {
          console.log("Target mesh found:", child.name);
          meshes.push(child as Mesh);
        }
      });
      setTargetMeshes(meshes);
    }
  }, [gltf]);

  useEffect(() => {
    if (targetMeshes.length > 0 && textures.length > 0) {
      const texture = textures[currentSkin];
      if (texture) {
        targetMeshes.forEach((mesh) => {
          const material = new MeshStandardMaterial({
            map: texture,
            roughness: 0.5,
            metalness: 0.5,
          });
          mesh.material = material;
          console.log(
            `Applied texture ${currentSkin} to mesh ${mesh.name}`,
            material
          );
        });
      }
    }
  }, [currentSkin, targetMeshes, textures]);

  return (
    <group scale={scale} position={position} rotation={rotation}>
      <primitive object={gltf.scene} />
    </group>
  );
}
