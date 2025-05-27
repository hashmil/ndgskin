import { useState } from "react";

interface PasswordProtectionProps {
  onCorrectPassword: () => void;
}

export default function PasswordProtection({
  onCorrectPassword,
}: PasswordProtectionProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Send password to server for verification
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      if (response.ok) {
        // Password correct - set session and authenticate
        localStorage.setItem('authenticated', 'true');
        await new Promise((resolve) => setTimeout(resolve, 500));
        onCorrectPassword();
      } else {
        setError(true);
        setPassword("");
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError(true);
      setPassword("");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 p-6 sm:p-8 rounded-lg border border-gray-700 max-w-md w-full">
        <div className="flex justify-center items-center mb-8">
          <img src="/lionx_logo.png" alt="LionX Logo" className="h-16 sm:h-20" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="bg-gradient-to-r from-cyan-500 to-purple-500 rounded p-[1px]">
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Enter password"
                className={`w-full py-3 px-4 bg-gray-700 text-white rounded focus:outline-none ${
                  error ? "ring-2 ring-red-500" : ""
                }`}
              />
            </div>
          </div>
          {error && (
            <p className="text-red-500 text-sm text-center">
              Incorrect password. Please try again.
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-medium py-3 px-6 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-200 shadow-sm">
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
