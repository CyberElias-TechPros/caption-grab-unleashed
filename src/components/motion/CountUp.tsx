import React from "react";
import { useCountUp, useInView } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface CountUpProps {
  value: number;
  /** Digits after the decimal point. */
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

/** A number that counts up the first time it scrolls into view. */
const CountUp: React.FC<CountUpProps> = ({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  duration = 1500,
  className,
}) => {
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: 0.4 });
  const display = useCountUp(value, inView, duration);
  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={cn("num tabular-nums", className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

export default CountUp;
