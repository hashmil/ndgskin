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
    if (password === process.env.NEXT_PUBLIC_ACCESS_PASSWORD) {
      setIsLoading(true);
      // Add a slight delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 500));
      onCorrectPassword();
    } else {
      setError(true);
      setPassword("");
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
      <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-8">
          <img src="/lionx_logo.png" alt="LionX Logo" className="h-8" />
          <img src="/ndg_logo.png" alt="NDG Logo" className="h-8" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
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
              className={`w-full px-4 py-2 rounded bg-gray-700 text-white border ${
                error ? "border-red-500" : "border-gray-600"
              } focus:outline-none ${
                error ? "focus:border-red-500" : "focus:border-blue-500"
              }`}
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm">
              Incorrect password. Please try again.
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
