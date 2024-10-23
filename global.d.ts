import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      orbitControls: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          ref?: React.RefObject<OrbitControlsImpl>;
          args?: [THREE.Camera, HTMLElement?];
        },
        HTMLElement
      >;
    }
  }
}
