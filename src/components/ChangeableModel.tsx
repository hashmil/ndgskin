// src/components/ChangeableModel.tsx

import React, { useEffect, useState } from "react";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
  Mesh,
  MeshPhysicalMaterial,
  Vector3,
  Euler,
  TextureLoader,
  RepeatWrapping,
  LinearFilter,
  Texture,
  Object3D,
  Color,
  BufferGeometry,
  MeshBasicMaterial,
} from "three";
import { Html, useProgress } from "@react-three/drei";

// Helper function to get the 2 most prominent colors from an image
function getDominantColors(imgEl: HTMLImageElement | HTMLCanvasElement | ImageBitmap): { color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number } } {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return { 
    color1: { r: 0.5, g: 0.5, b: 0.5 }, 
    color2: { r: 0.3, g: 0.3, b: 0.3 } 
  };

  canvas.width = imgEl.width;
  canvas.height = imgEl.height;

  try {
    context.drawImage(imgEl, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Color frequency map
    const colorMap = new Map<string, number>();
    
    // Sample every 4th pixel for performance
    for (let i = 0; i < data.length; i += 16) {
      const r = Math.floor(data[i] / 32) * 32;     // Reduce precision for grouping
      const g = Math.floor(data[i + 1] / 32) * 32;
      const b = Math.floor(data[i + 2] / 32) * 32;
      const colorKey = `${r},${g},${b}`;
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
    }
    
    // Sort by frequency and get top 2
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);
    
    if (sortedColors.length >= 2) {
      const [r1, g1, b1] = sortedColors[0][0].split(',').map(Number);
      const [r2, g2, b2] = sortedColors[1][0].split(',').map(Number);
      return {
        color1: { r: r1 / 255, g: g1 / 255, b: b1 / 255 },
        color2: { r: r2 / 255, g: g2 / 255, b: b2 / 255 }
      };
    } else {
      return { 
        color1: { r: 0.5, g: 0.5, b: 0.5 }, 
        color2: { r: 0.3, g: 0.3, b: 0.3 } 
      };
    }
  } catch (e) {
    console.error("Error getting dominant colors:", e);
    return { 
      color1: { r: 0.5, g: 0.5, b: 0.5 }, 
      color2: { r: 0.3, g: 0.3, b: 0.3 } 
    };
  }
}


// Helper function to fix geometry normals and smooth edges
function fixGeometryNormals(gltf: any) {
  gltf.scene.traverse((child: Object3D) => {
    if ((child as Mesh).isMesh) {
      const mesh = child as Mesh;
      const geometry = mesh.geometry as BufferGeometry;
      const material = mesh.material as MeshPhysicalMaterial;
      
      // Compute vertex normals for proper lighting and smooth edges
      geometry.computeVertexNormals();
      
      // Ensure smooth shading for better antialiasing
      if (material) {
        material.flatShading = false; // Force smooth shading
        material.needsUpdate = true;
      }
      
      // Optimize geometry for better rendering
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      
      console.log(`Fixed normals and smoothing for mesh: ${child.name}`);
    }
  });
}

// Phone model mesh names - updated to target the phone back panel
const targetMeshNames = [
  "object_4", // Phone back panel where texture will be applied
];

interface ChangeableModelProps {
  url: string;
  scale: number;
  position: Vector3;
  mobilePosition: Vector3;
  rotation: Euler;
  textureUrl: string | null;
  onTextureLoaded: () => void;
}

export const ChangeableModel = React.memo(function ChangeableModel({
  url,
  scale = 1,
  position = new Vector3(0, 0, 0),
  mobilePosition,
  rotation = new Euler(0, 0, 0),
  textureUrl,
  onTextureLoaded,
}: ChangeableModelProps) {
  const gltf = useLoader(GLTFLoader, url);
  const [currentPosition, setCurrentPosition] = useState(position);

  // Fix geometry normals when GLTF loads
  useEffect(() => {
    if (gltf) {
      fixGeometryNormals(gltf);
    }
  }, [gltf]);

  useEffect(() => {
    const isMobile = window.innerWidth < 640; // SM breakpoint in Tailwind
    setCurrentPosition(isMobile ? mobilePosition : position);
  }, [position, mobilePosition]);

  useEffect(() => {
    console.log("ChangeableModel useEffect - textureUrl:", textureUrl);
    console.log("ChangeableModel useEffect - gltf exists:", !!gltf);
    
    if (gltf) {
      const textureLoader = new TextureLoader();
      
      // Load the alpha texture for Plane008 logo cutout
      textureLoader.load("/textures/logomatte.jpg", (loadedAlphaTexture) => {
        console.log("Logo alpha texture loaded successfully");
        loadedAlphaTexture.flipY = false;
        
        // Apply alpha texture to Plane008 mesh
        gltf.scene.traverse((child: Object3D) => {
          if ((child as Mesh).isMesh && child.name === "Plane008") {
            console.log("Found Plane008 mesh, applying logo alpha texture");
            
            // Create a new material with alpha map for cutout effect
            const logoMaterial = new MeshPhysicalMaterial({
              color: 0xffffff,
              alphaMap: loadedAlphaTexture,
              transparent: true,
              alphaTest: 0.5, // This creates the cutout effect
              metalness: 0.5,
              roughness: 0.1,
            });
            
            (child as Mesh).material = logoMaterial;
            console.log("Applied logo alpha texture to Plane008");
          }
        });
      });
      
      if (textureUrl) {
        textureLoader.load(textureUrl, (loadedTexture) => {
          console.log("ChangeableModel: Texture loaded successfully from:", textureUrl);
          loadedTexture.wrapS = RepeatWrapping;
          loadedTexture.wrapT = RepeatWrapping;
          loadedTexture.magFilter = LinearFilter; // Use linear filtering for smoother textures
          loadedTexture.minFilter = LinearFilter;
          loadedTexture.generateMipmaps = true; // Enable mipmaps for better quality
          loadedTexture.flipY = false; // Important for GLTF textures

          // Get the 2 dominant colors from the main texture
          const dominantColors = getDominantColors(loadedTexture.image);
          console.log("Dominant colors:", dominantColors);

          // Load screen base texture and create gradient multiply effect
          textureLoader.load("/textures/screen-bw.jpg", (loadedScreenTexture) => {
            console.log("Screen base texture loaded successfully");
            loadedScreenTexture.flipY = false;
            
            // Create canvas for blending
            const blendCanvas = document.createElement('canvas');
            const blendCtx = blendCanvas.getContext('2d');
            blendCanvas.width = loadedScreenTexture.image.width;
            blendCanvas.height = loadedScreenTexture.image.height;
            
            if (blendCtx) {
              // First, draw the screen-bw.jpg as base
              blendCtx.drawImage(loadedScreenTexture.image, 0, 0, blendCanvas.width, blendCanvas.height);
              
              // Create gradient canvas
              const gradientCanvas = document.createElement('canvas');
              const gradientCtx = gradientCanvas.getContext('2d');
              gradientCanvas.width = blendCanvas.width;
              gradientCanvas.height = blendCanvas.height;
              
              if (gradientCtx) {
                // Create vertical gradient from dominant colors
                const gradient = gradientCtx.createLinearGradient(0, 0, 0, gradientCanvas.height);
                gradient.addColorStop(0, `rgb(${dominantColors.color1.r * 255}, ${dominantColors.color1.g * 255}, ${dominantColors.color1.b * 255})`);
                gradient.addColorStop(1, `rgb(${dominantColors.color2.r * 255}, ${dominantColors.color2.g * 255}, ${dominantColors.color2.b * 255})`);
                
                gradientCtx.fillStyle = gradient;
                gradientCtx.fillRect(0, 0, gradientCanvas.width, gradientCanvas.height);
                
                // Manual pixel-level multiplication of screen texture with gradient
                const screenImageData = blendCtx.getImageData(0, 0, blendCanvas.width, blendCanvas.height);
                const gradientImageData = gradientCtx.getImageData(0, 0, gradientCanvas.width, gradientCanvas.height);
                const resultImageData = blendCtx.createImageData(blendCanvas.width, blendCanvas.height);
                
                for (let i = 0; i < screenImageData.data.length; i += 4) {
                  // Multiply each RGB channel (0-255 values)
                  resultImageData.data[i] = (screenImageData.data[i] * gradientImageData.data[i]) / 255;     // Red
                  resultImageData.data[i + 1] = (screenImageData.data[i + 1] * gradientImageData.data[i + 1]) / 255; // Green
                  resultImageData.data[i + 2] = (screenImageData.data[i + 2] * gradientImageData.data[i + 2]) / 255; // Blue
                  resultImageData.data[i + 3] = 255; // Alpha (fully opaque)
                }
                
                // Clear canvas and draw the multiplied result
                blendCtx.clearRect(0, 0, blendCanvas.width, blendCanvas.height);
                blendCtx.putImageData(resultImageData, 0, 0);
                
                // Add phone-style clock overlay
                const now = new Date();
                const hours = now.getHours().toString().padStart(2, '0');
                const minutes = now.getMinutes().toString().padStart(2, '0');
                
                // Get day and date
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const dayOfWeek = dayNames[now.getDay()];
                const dayOfMonth = now.getDate();
                const month = monthNames[now.getMonth()];
                const dateString = `${dayOfWeek} ${dayOfMonth} ${month}`;
                
                // Set up text styling for time (vertical format like reference) - no overlay
                blendCtx.globalCompositeOperation = 'source-over';
                blendCtx.fillStyle = 'rgba(255, 255, 255, 0.3)'; // Much more transparent white
                blendCtx.strokeStyle = 'rgba(0, 0, 0, 0.1)'; // Very subtle stroke
                blendCtx.lineWidth = 0.5;
                blendCtx.textAlign = 'center';
                blendCtx.textBaseline = 'middle';
                
                // Calculate font sizes - bigger overall
                const timeFontSize = Math.min(blendCanvas.width / 3, blendCanvas.height / 4.5);
                const dateFontSize = timeFontSize / 6; // Much smaller date
                
                // Position for vertical time display
                const centerX = blendCanvas.width / 2;
                const timeStartY = blendCanvas.height / 5;
                const lineHeight = timeFontSize * 0.8;
                
                // Draw time vertically (like reference: 02 on top, 34 below)
                try {
                  // Try to load RobotoMono-Light, fallback to monospace
                  blendCtx.font = `300 ${timeFontSize}px RobotoMono-Light, 'Roboto Mono', monospace`;
                } catch (e) {
                  blendCtx.font = `300 ${timeFontSize}px 'Roboto Mono', Consolas, monospace`;
                }
                
                // Draw hours
                blendCtx.strokeText(hours, centerX, timeStartY);
                blendCtx.fillText(hours, centerX, timeStartY);
                
                // Draw minutes below hours
                blendCtx.strokeText(minutes, centerX, timeStartY + lineHeight);
                blendCtx.fillText(minutes, centerX, timeStartY + lineHeight);
                
                // Draw date below time with tight letter spacing
                blendCtx.font = `400 ${dateFontSize}px 'Roboto Mono', monospace`;
                blendCtx.fillStyle = 'rgba(255, 255, 255, 0.2)'; // Even more transparent for date
                blendCtx.strokeStyle = 'rgba(0, 0, 0, 0.05)'; // Almost no stroke
                blendCtx.letterSpacing = '-0.5px'; // Tighter letter spacing
                
                const dateY = timeStartY + lineHeight * 1.8;
                blendCtx.strokeText(dateString, centerX, dateY);
                blendCtx.fillText(dateString, centerX, dateY);
                
                console.log(`Created gradient-multiplied screen texture with phone clock: ${hours}:${minutes}, ${dateString}`);
              }
            }
            
            // Create final texture from blended canvas
            const finalScreenTexture = new Texture(blendCanvas);
            finalScreenTexture.needsUpdate = true;
            finalScreenTexture.flipY = false;
            finalScreenTexture.wrapS = RepeatWrapping;
            finalScreenTexture.wrapT = RepeatWrapping;
            finalScreenTexture.magFilter = LinearFilter;
            finalScreenTexture.minFilter = LinearFilter;
            
            // Apply the blended texture to screen mesh
            gltf.scene.traverse((child: Object3D) => {
              if ((child as Mesh).isMesh && child.name === "object_38") {
                const material = (child as Mesh).material as MeshPhysicalMaterial;
                material.map = finalScreenTexture;
                material.color.setRGB(1, 1, 1); // White base to show texture properly
                material.transparent = false;
                material.opacity = 1.0;
                material.needsUpdate = true;
                console.log(`Applied gradient-multiplied texture to screen mesh ${child.name}`);
              }
            });
          });

          gltf.scene.traverse((child: Object3D) => {
            if ((child as Mesh).isMesh) { 
              console.log("Found mesh with name:", child.name); // Log mesh name
              const material = (child as Mesh).material as MeshPhysicalMaterial;
              
              material.emissive.setRGB(0, 0, 0); 
              material.emissiveIntensity = 0; 

              if (targetMeshNames.includes(child.name)) {
                material.color.setRGB(1, 1, 1); // White base for textured part
                material.map = loadedTexture; 
                console.log(`Applying texture to ${child.name}, base color white`);
                material.needsUpdate = true;
              } else if (child.name !== "Plane008" && child.name !== "object_38") {
                // For other meshes (except Plane008 and object_38), keep original material properties
                // object_38 is handled in the screenTexture load callback above
                console.log(`Keeping original material for mesh: ${child.name}`);
                material.needsUpdate = true;
              }
            }
          });
          onTextureLoaded();
        });
      } else {
        // If no textureUrl, load screen texture with default gradient and clock
        textureLoader.load("/textures/screen-bw.jpg", (loadedScreenTexture) => {
          console.log("Default screen texture loaded successfully");
          loadedScreenTexture.flipY = false;
          
          // Create canvas for blending screen texture with default gradient and clock
          const defaultCanvas = document.createElement('canvas');
          const defaultCtx = defaultCanvas.getContext('2d');
          defaultCanvas.width = loadedScreenTexture.image.width;
          defaultCanvas.height = loadedScreenTexture.image.height;
          
          if (defaultCtx) {
            // First, draw the screen-bw.jpg as base
            defaultCtx.drawImage(loadedScreenTexture.image, 0, 0, defaultCanvas.width, defaultCanvas.height);
            
            // Create default gradient
            const gradientCanvas = document.createElement('canvas');
            const gradientCtx = gradientCanvas.getContext('2d');
            gradientCanvas.width = defaultCanvas.width;
            gradientCanvas.height = defaultCanvas.height;
            
            if (gradientCtx) {
              // Create vertical gradient with default colors
              const gradient = gradientCtx.createLinearGradient(0, 0, 0, gradientCanvas.height);
              gradient.addColorStop(0, 'rgb(80, 80, 80)');
              gradient.addColorStop(1, 'rgb(40, 40, 40)');
              
              gradientCtx.fillStyle = gradient;
              gradientCtx.fillRect(0, 0, gradientCanvas.width, gradientCanvas.height);
              
              // Manual pixel-level multiplication of screen texture with default gradient
              const screenImageData = defaultCtx.getImageData(0, 0, defaultCanvas.width, defaultCanvas.height);
              const gradientImageData = gradientCtx.getImageData(0, 0, gradientCanvas.width, gradientCanvas.height);
              const resultImageData = defaultCtx.createImageData(defaultCanvas.width, defaultCanvas.height);
              
              for (let i = 0; i < screenImageData.data.length; i += 4) {
                resultImageData.data[i] = (screenImageData.data[i] * gradientImageData.data[i]) / 255;
                resultImageData.data[i + 1] = (screenImageData.data[i + 1] * gradientImageData.data[i + 1]) / 255;
                resultImageData.data[i + 2] = (screenImageData.data[i + 2] * gradientImageData.data[i + 2]) / 255;
                resultImageData.data[i + 3] = 255;
              }
              
              defaultCtx.clearRect(0, 0, defaultCanvas.width, defaultCanvas.height);
              defaultCtx.putImageData(resultImageData, 0, 0);
              
              // Add clock overlay
              const now = new Date();
              const hours = now.getHours().toString().padStart(2, '0');
              const minutes = now.getMinutes().toString().padStart(2, '0');
              
              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const dayOfWeek = dayNames[now.getDay()];
              const dayOfMonth = now.getDate();
              const month = monthNames[now.getMonth()];
              const dateString = `${dayOfWeek} ${dayOfMonth} ${month}`;
              
              // Time styling - no overlay, more transparent
              defaultCtx.globalCompositeOperation = 'source-over';
              defaultCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
              defaultCtx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
              defaultCtx.lineWidth = 0.5;
              defaultCtx.textAlign = 'center';
              defaultCtx.textBaseline = 'middle';
              
              const timeFontSize = Math.min(defaultCanvas.width / 3, defaultCanvas.height / 4.5);
              const dateFontSize = timeFontSize / 6;
              
              const centerX = defaultCanvas.width / 2;
              const timeStartY = defaultCanvas.height / 5;
              const lineHeight = timeFontSize * 0.8;
              
              // Draw time
              try {
                defaultCtx.font = `300 ${timeFontSize}px RobotoMono-Light, 'Roboto Mono', monospace`;
              } catch (e) {
                defaultCtx.font = `300 ${timeFontSize}px 'Roboto Mono', Consolas, monospace`;
              }
              
              defaultCtx.strokeText(hours, centerX, timeStartY);
              defaultCtx.fillText(hours, centerX, timeStartY);
              defaultCtx.strokeText(minutes, centerX, timeStartY + lineHeight);
              defaultCtx.fillText(minutes, centerX, timeStartY + lineHeight);
              
              // Draw date
              defaultCtx.font = `400 ${dateFontSize}px 'Roboto Mono', monospace`;
              defaultCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
              defaultCtx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
              defaultCtx.letterSpacing = '-0.5px';
              
              const dateY = timeStartY + lineHeight * 1.8;
              defaultCtx.strokeText(dateString, centerX, dateY);
              defaultCtx.fillText(dateString, centerX, dateY);
              
              console.log("Created default screen texture with gradient multiply and clock");
            }
            
            // Create final texture and apply to screen mesh
            const finalScreenTexture = new Texture(defaultCanvas);
            finalScreenTexture.needsUpdate = true;
            finalScreenTexture.flipY = false;
            finalScreenTexture.wrapS = RepeatWrapping;
            finalScreenTexture.wrapT = RepeatWrapping;
            finalScreenTexture.magFilter = LinearFilter;
            finalScreenTexture.minFilter = LinearFilter;
            
            // Apply to screen mesh
            gltf.scene.traverse((child: Object3D) => {
              if ((child as Mesh).isMesh && child.name === "object_38") {
                const material = (child as Mesh).material as MeshPhysicalMaterial;
                material.map = finalScreenTexture;
                material.color.setRGB(1, 1, 1);
                material.transparent = false;
                material.opacity = 1.0;
                material.needsUpdate = true;
                console.log(`Applied default screen texture with clock to ${child.name}`);
              }
            });
          }
        });

        gltf.scene.traverse((child: Object3D) => {
          if ((child as Mesh).isMesh) {
            console.log("Found mesh in GLTF (no texture load):", child.name);
            if (child.name !== "Plane008" && child.name !== "object_38") {
              const material = (child as Mesh).material as MeshPhysicalMaterial;
              material.needsUpdate = true;
            }
          }
        });
        console.log("No texture URL, setting default materials with screen texture.");
        onTextureLoaded(); // Call if GLTF is loaded but no texture
      }
    }
  }, [gltf, textureUrl, targetMeshNames, onTextureLoaded]);

  if (!gltf) {
    return (
      <Html center>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <div className="loading-spinner"></div>
        </div>
      </Html>
    );
  }

  return (
    <group scale={scale} position={currentPosition} rotation={rotation}>
      <primitive object={gltf.scene} />
    </group>
  );
});
