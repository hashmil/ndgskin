import React from "react";

interface SaveImageButtonProps {
  onSave: () => void;
  className?: string;
}

export default function SaveImageButton({
  onSave,
  className = "",
}: SaveImageButtonProps) {
  return (
    <button
      onClick={onSave}
      className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}>
      Save Image
    </button>
  );
}
