import { useState, useEffect } from "react";

export function useViewportHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
      setHeight(window.innerHeight);
    };

    updateHeight();

    window.addEventListener("resize", updateHeight);
    window.addEventListener("orientationchange", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("orientationchange", updateHeight);
    };
  }, []);

  return height;
}
