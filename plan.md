# Project Plan and Progress: AI Skins Generator App

## Overview

This document tracks the development progress, architectural decisions, and features implemented for the **AI Skins Generator App**. The primary goal is to provide an interactive WebGL experience where users can **input any text prompt to generate a unique AI-created image (a 'skin') and instantly apply it as a texture to a 3D product model (currently a bottle), visualizing the result in a dynamic 3D scene.** This leverages React Three Fiber for the 3D rendering and an external AI service for image generation. The main application logic resides in `src/app/page.tsx`.

## Core User Workflow: Text Prompt to 3D Skin

1. **User Input**: The user enters a descriptive text prompt for the desired skin/texture.
2. **AI Generation**: The application sends this prompt to an AI image generation service.
3. **Texture Application**: The AI-generated image is received and applied as a texture to the designated parts of the 3D model (`ChangeableModel.tsx`).
4. **3D Visualization**: The user sees the 3D model updated in real-time with their custom-generated skin, and can interact with it (orbit, zoom) in the 3D scene.
5. **Material Adaptation**: Auxiliary parts of the model (e.g., the bottle cap) have their material color dynamically adjusted to complement the generated skin.

## Implemented Features & Key Milestones

### 1. Core 3D Scene & Model Setup

*   Interactive 3D scene initialized using the `<Canvas>` component from `@react-three/fiber` in `src/app/page.tsx`.
*   The GLTF model (`public/assets/bottle.glb`) serves as the current product for skin application, managed by `ChangeableModel` (`src/components/ChangeableModel.tsx`).
*   Camera interaction (orbit, pan, zoom) via `<OrbitControls>` in `CameraController` (`src/app/page.tsx`).

### 2. Dynamic AI Skin Generation and Application (`ChangeableModel` & `src/app/page.tsx`)

*   **Text-to-Texture Pipeline**: Functionality to take a user's text prompt, call an external AI image generation API (handled in `Home` component in `src/app/page.tsx`), and receive an image URL.
*   **Real-time Skinning**: The received image is loaded via `THREE.TextureLoader` and applied as a `material.map` to the target mesh(es) of the 3D model (e.g., the 'bottle' part).
*   **Adaptive Cap Coloring**: The 'Cap' mesh's color is dynamically set to the average color of the AI-generated skin. This uses the `getAverageRGB` utility in `ChangeableModel.tsx` to analyze the texture and apply the derived color to the cap's `material.color`.

### 3. Lighting System

*   Configuration in `src/app/page.tsx`'s `Home` component includes:
    *   **`HemisphereLight`**: For soft, global ambient illumination.
    *   **`DirectionalLight`**: (via `LightWithHelper`) Simulates a primary light source, casting shadows.
    *   **`AmbientLight`**: Ensures all parts of the model are subtly illuminated.
*   `DirectionalLight` enhancements in `LightWithHelper` include robust target management and an optional visual helper.

### 4. Camera Configuration (`CameraController` component in `src/app/page.tsx`)

*   The main `<Canvas>` `camera={{ fov: 40 }}` prop is effectively overridden by Leva for dynamic control.
*   Leva (`useControls`) is used for fine-tuning camera parameters: position, rotation, zoom, target height, and FOV.
    *   **FOV Control**: Actively used, allowing dynamic FOV adjustments. Default: `86` degrees.
    *   **Current Default Camera Settings** (from Leva `useControls`):
        *   Position (posX, posY, posZ): `(-0.9, 1.6, 9.9)`
        *   Rotation (rotX, rotY, rotZ): `(-0.8, 0.66, 0.52)` (radians)
        *   Zoom: `39.5`
        *   Target Height: `12.5`

### 5. User Interface (UI) & User Experience (UX) (`src/app/page.tsx`)

*   **Password Protection**: `PasswordProtection` component gates access.
*   **Prompt Input**: A text input field allows users to enter prompts for skin generation.
*   **Texture Panel**: `TexturePanel` component displays the user's prompt and the resulting generated texture image.
*   Leva Control Panel (`leva` library):
    *   Used for camera controls only; other Leva controls (Lighting, Model Transform) are commented out to simplify the primary user experience.
    *   Hidden by default (`hidden={true}`) but toggleable for debugging/fine-tuning camera.

### 6. Debugging and Refinements

*   Addressed type errors and resolved Three.js specific issues (e.g., `light.target is null`).
*   Iterated on camera FOV controls, settling on Leva-driven dynamic adjustments.

## Current Status (As of latest update)

*   The **AI Skins Generator App** successfully allows users to input a text prompt, generate an AI image, and see it applied as a skin to a 3D bottle model in real-time, within a password-protected environment.
*   The bottle cap color dynamically adapts to the generated skin.
*   Lighting and camera are configured to provide a clear view of the skinned model, with camera settings adjustable via a hidden Leva panel.

## Next Steps / Potential Future Work (General Ideas)

*   Enhanced prompt engineering guides or examples for users.
*   Support for multiple 3D models or user-uploaded models.
*   More advanced material property adjustments (e.g., PBR properties like roughness, metalness) for the generated skins.
*   Saving, sharing, or exporting generated 3D skins/models.
*   User accounts and gallery of generated skins.
