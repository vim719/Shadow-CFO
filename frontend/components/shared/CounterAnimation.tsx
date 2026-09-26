import React, { useEffect, useRef, useState } from "react";

interface CounterAnimationProps {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
}

export default function CounterAnimation({
  target,
  duration = 2000,
  prefix = "",
  suffix = "",
  className = "",
  decimals = 0,
}: CounterAnimationProps) {
  const [value, setValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = 0;
    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + (target - start) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  const formatted = value.toFixed(decimals);
  const [integer, decimal] = formatted.split(".");

  return (
    <span className={className}>
      {prefix}
      {Number(integer).toLocaleString()}
      {decimals > 0 && decimal !== undefined && <span>.{decimal}</span>}
      {suffix}
    </span>
  );
}
