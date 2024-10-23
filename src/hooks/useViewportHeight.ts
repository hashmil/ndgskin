import { useState, useEffect } from "react";

export function useViewportHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      // Get the visual viewport height
      const vh = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
      setHeight(vh);
    };

    updateHeight();

    // Listen to both resize and scroll events for iOS Safari
    window.visualViewport?.addEventListener("resize", updateHeight);
    window.visualViewport?.addEventListener("scroll", updateHeight);
    window.addEventListener("resize", updateHeight);
    window.addEventListener("orientationchange", updateHeight);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateHeight);
      window.visualViewport?.removeEventListener("scroll", updateHeight);
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("orientationchange", updateHeight);
    };
  }, []);

  return height;
}
