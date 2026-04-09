import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface CreditCounterProps {
  value: number;
}

export default function CreditCounter({ value }: CreditCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500; // ms
    const incrementTime = 16;
    const steps = duration / incrementTime;
    const incrementAmount = value / steps;

    const timer = setInterval(() => {
      start += incrementAmount;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.span 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-block tabular-nums"
    >
      {displayValue}
    </motion.span>
  );
}
