import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TexturePanelProps {
  prompt?: string;
  textureUrl?: string | null;
}

export default function TexturePanel({
  prompt,
  textureUrl,
}: TexturePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50">
      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-white/95 backdrop-blur-sm shadow-lg rounded-l-lg w-80 p-6">
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Adapted Prompt
                </h3>
                <div className="p-3 bg-gray-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    {prompt || "No prompt yet"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Generated texture
                </h3>
                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  {textureUrl ? (
                    <img
                      src={textureUrl}
                      alt="Generated texture"
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center text-gray-400">
                      No texture generated
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            onClick={() => setIsExpanded(true)}
            className="bg-white/95 backdrop-blur-sm shadow-lg px-3 py-6 rounded-l-lg text-gray-600 hover:text-gray-900">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M15 6L9 12L15 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
