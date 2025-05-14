# Project Plan and Progress: 3D Model Viewer

## Overview

This document tracks the development progress, architectural decisions, and features implemented for the 3D model viewer application. The primary goal is to create an interactive WebGL experience using React Three Fiber, focusing on dynamic texturing and lighting for a bottle model. The main application logic resides in `src/app/page.tsx`.

## Implemented Features & Key Milestones

### 1. Core Scene Setup

*   Initialized using the `<Canvas>` component from `@react-three/fiber` in `src/app/page.tsx`.
*   The GLTF model (`public/assets/bottle.glb`) is loaded and managed by the `ChangeableModel` component (`src/components/ChangeableModel.tsx`).
*   User interaction with the camera (orbit, pan, zoom) is enabled via the `<OrbitControls>` component from `@react-three/drei`, configured within the `CameraController` component in `src/app/page.tsx`.

### 2. Lighting System

*   Explored with `RectAreaLight` and `SoftboxLight`.
*   Revised Lighting Configuration (current setup in `src/app/page.tsx` and `SceneContent` component):
    *   **`HemisphereLight`**: Adopted for global ambient illumination, providing a soft sky and ground color. Chosen for a more natural, diffuse environmental light.
    *   **`DirectionalLight`**: Re-enabled for simulating a primary light source (e.g., sun). This light casts shadows, adding depth to the scene.
    *   **`AmbientLight`**: A subtle, non-directional light re-added to ensure all parts of the model receive some illumination, preventing overly dark areas.
*   `DirectionalLight` Enhancements (within `LightWithHelper` component in `src/app/page.tsx`):
    *   **Target Management**: Programmatically managed the `DirectionalLight.target` object. Its position is updated using `useEffect` (for initial setup and prop changes) and `useFrame` (for dynamic updates from Leva controls). This resolved the common `TypeError: light.target is null` runtime error by ensuring the target's `matrixWorld` is updated before rendering.
    *   **Conditional Helper**: Integrated `THREE.DirectionalLightHelper` via the `useHelper` hook from `@react-three/drei`. The helper's visibility is controlled by a `showHelper` prop (currently set to `false` by default to hide it).

### 3. Model Customization & Texturing (`ChangeableModel` component - `src/components/ChangeableModel.tsx`)

*   Implemented functionality to fetch an AI-generated image and apply it as a texture to the 'bottle' mesh of the GLTF model. This involves creating a `THREE.TextureLoader` and applying the loaded texture to `material.map`.
*   The 'Cap' mesh's color is dynamically set to match the predominant color of the texture applied to the bottle. This involved:
    *   A utility function `getAverageRGB` (within `ChangeableModel.tsx`) to calculate the average color of a texture image by drawing it to a canvas and analyzing pixel data.
    *   Applying this average color to the `material.color` property of the cap mesh. The cap mesh is explicitly prevented from receiving the bottle's texture.

### 4. Camera Configuration

*   The main `<Canvas>` component in `src/app/page.tsx` is configured with `camera={{ fov: 40 }}`. This provides the primary definition for the camera's FOV.
*   `CameraController` Component (`src/app/page.tsx`):
    *   Uses Leva (`useControls`) for debugging camera position, rotation, and zoom.
    *   **FOV Control Removed**: Previously, `CameraController` also had a Leva control for FOV, which would override the `<Canvas>` prop. This Leva FOV control and its corresponding `useEffect` that updated `camera.fov` have been removed to ensure the `fov: 40` from the `<Canvas>` prop is respected as the definitive setting.

### 5. User Interface (UI) & User Experience (UX) (`src/app/page.tsx`)

*   Leva Control Panel (`leva` library):
    *   The main Leva panel instance (`<Leva hidden={true} />`) is now rendered only once within the authenticated section of the `Home` component. This ensures that all `useControls` hooks throughout the application use this single store and panel.
    *   The panel is hidden by default (`hidden={true}`) for a cleaner production view but can be toggled (e.g., via Leva's default toggle).
    *   **Login Page**: The Leva panel is no longer displayed on the password protection screen, as it's now part of the authenticated component tree.
*   The `PasswordProtection` component (`src/components/PasswordProtection.tsx`) gates access to the main 3D application content.
*   The `TexturePanel` component (`src/components/TexturePanel.tsx`) and buttons in `Home` facilitate user interaction for generating AI textures.

### 6. Debugging and Refinements

*   Addressed type errors, especially concerning refs passed to `useHelper` (requiring `React.MutableRefObject` instead of `React.RefObject`) and ensuring correct types for Three.js objects like `PerspectiveCamera` when accessing specific properties (e.g., `camera.fov`).
*   Specifically resolved the `TypeError: light.target is null` for `DirectionalLight` by ensuring its `target` object is correctly initialized, added to the scene (if necessary), and its world matrix updated before the lighting calculations occur during the render loop.
*   Ensured the camera's FOV is consistently `40` by removing the conflicting FOV control from the `CameraController` component's Leva schema and associated `useEffect` updates. The `<Canvas camera={{ fov: 40 }}` prop is now the source of truth.
*   Consolidated the `<Leva />` panel rendering to a single instance within the authenticated part of `Home` component. This fixed issues where multiple Leva panels might appear or where the panel was visible on the login screen.

## Current Status (As of last interaction)

*   The application successfully renders the 3D bottle model within an interactive scene.
*   Dynamic texturing of the bottle mesh and corresponding updates to the cap's color (based on the texture's average color) are fully functional.
*   The lighting setup (Hemisphere, Directional, Ambient) provides balanced and visually appealing illumination.
*   Camera FOV is reliably set to 40.
*   The Leva control panel is hidden by default and correctly scoped to the authenticated application view, not appearing on the login page.
*   Primary known runtime errors (like `light.target is null`) have been resolved.

## Next Steps / Potential Future Work (General Ideas)

*   Further refinement of texture generation prompts and exploration of different AI models or parameters.
*   Implementation of more advanced material properties for the bottle and cap (e.g., adjusting roughness, metalness, clearcoat effects for glass/plastic/metal appearances).
*   Adding an environment map for realistic reflections on the model surfaces.
*   Developing user-configurable lighting presets or more granular light controls accessible via the UI.
*   Performance optimizations, especially if dealing with very high-resolution textures or more complex 3D models/scenes.
*   Investigating minor visual discrepancies or further user-desired refinements (e.g., fine-tuning camera zoom/framing for optimal model presentation).
