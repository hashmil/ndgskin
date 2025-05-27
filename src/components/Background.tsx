import { useThree, useFrame } from "@react-three/fiber";

// CSS Background component (rendered outside Canvas)
export function Background() {
  return (
    <div 
      id="parallax-bg"
      className="fixed inset-0 -z-10"
      style={{
        backgroundImage: 'url(/bg1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        filter: 'brightness(0.5)',
        transition: 'transform 0.1s ease-out',
        transform: 'scale(1.1)' // Pre-scale for parallax movement
      }}
    />
  );
}

// Camera tracker component (rendered inside Canvas)
export function ParallaxTracker() {
  const { camera } = useThree();

  useFrame(() => {
    const bgElement = document.getElementById('parallax-bg');
    if (bgElement && camera) {
      // Get camera rotation for parallax effect
      const rotationX = camera.rotation.x;
      const rotationY = camera.rotation.y;
      
      // Convert rotation to subtle background movement
      const moveX = rotationY * 10; // 10px per radian
      const moveY = -rotationX * 10; // Inverted for natural feel
      
      // Apply transform with subtle movement
      bgElement.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.1)`;
    }
  });

  return null;
}
