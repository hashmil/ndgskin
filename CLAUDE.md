# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build for production (outputs to standalone mode)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Docker
- `docker-compose up` - Run in production mode (requires env vars)

## Architecture

This is an **AI Skins Generator** - a Next.js app that generates AI textures and applies them to 3D models in real-time using React Three Fiber.

### Core Workflow
1. User enters text prompt → 2. AI generates texture via FAL API → 3. Texture applied to 3D model → 4. Real-time 3D visualization

### Key Components
- `src/app/page.tsx` - Main app with 3D Canvas, camera controls (Leva), and prompt input
- `src/components/ChangeableModel.tsx` - Handles GLTF model loading and dynamic texture application
- `src/app/api/generateTexture/route.ts` - FAL AI API integration using flux-pro/v1.1 model
- `src/components/TexturePanel.tsx` - Displays user prompt and generated texture
- `src/components/PasswordProtection.tsx` - Access gate component

### 3D Scene Setup
- Uses `@react-three/fiber` Canvas with OrbitControls
- Camera controlled by Leva panel (hidden by default, FOV: 86°, position: (-0.9, 1.6, 9.9))
- Lighting: HemisphereLight + DirectionalLight + AmbientLight
- Model: `public/bottle.glb` with dynamic texture mapping to 'bottle' mesh
- Cap color auto-adapts to texture average color using `getAverageRGB` utility

### Environment Variables Required
- `FAL_API_KEY` - For AI texture generation
- `NEXT_PUBLIC_ACCESS_PASSWORD` - App access protection
- `OPENAI_API_KEY` - Currently used in project setup

### File Handling
- GLTF models loaded via webpack config in `next.config.js`
- Standalone output mode configured for Docker deployment