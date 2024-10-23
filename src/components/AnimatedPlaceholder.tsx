import { useState, useEffect } from "react";

const prompts = [
  "Minimal geometric pastels pattern",
  "Watercolor floral swirls",
  "Vibrant abstract leopard print",
  "Flowing cool wave lines",
  "Tropical leaves and birds",
  "Retro mid-century shapes",
  "Monochrome city skyline",
  "Playful quirky doodles",
  "Intricate gold Art Deco",
  "Simple line abstract forms",
];

interface AnimatedPlaceholderProps {
  className: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  value: string;
}

export default function AnimatedPlaceholder({
  className,
  onChange,
  onKeyDown,
  value,
}: AnimatedPlaceholderProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsChanging(true);
      setTimeout(() => {
        setPlaceholderIndex((current) => (current + 1) % prompts.length);
        setIsChanging(false);
      }, 200);
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={prompts[placeholderIndex]}
      className={`
        ${className}
        placeholder:transition-opacity placeholder:duration-200
        ${isChanging ? "placeholder:opacity-0" : "placeholder:opacity-100"}
      `}
    />
  );
}
