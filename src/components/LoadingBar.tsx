import { useState, useEffect } from 'react';

interface LoadingBarProps {
  isLoading: boolean;
  progress?: number;
  message?: string;
}

export default function LoadingBar({ isLoading, progress = 0, message = "Loading AI Skins Generator" }: LoadingBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      // Animate progress bar
      const interval = setInterval(() => {
        setDisplayProgress((prev) => {
          if (progress > 0) {
            return Math.min(progress, 100);
          }
          // Simulate loading if no progress provided - go to 100%
          return Math.min(prev + Math.random() * 8, 100);
        });
      }, 150);

      return () => clearInterval(interval);
    } else {
      // Complete the loading bar immediately
      setDisplayProgress(100);
      // Wait a bit longer before hiding to show completion
      setTimeout(() => setDisplayProgress(0), 500);
    }
  }, [isLoading, progress]);

  if (!isLoading && displayProgress === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4">
        {/* Loading text */}
        <div className="text-white text-lg font-medium">
          {message}
        </div>
        
        {/* Progress bar container */}
        <div className="w-80 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-200 ease-out"
            style={{ 
              width: `${displayProgress}%`,
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)'
            }}
          />
        </div>
        
        {/* Progress percentage */}
        <div className="text-gray-400 text-sm">
          {Math.round(displayProgress)}%
        </div>
      </div>
    </div>
  );
}