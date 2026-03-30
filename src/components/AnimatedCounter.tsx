import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  value: number;
  duration?: number;
}

const AnimatedCounter = ({ value, duration = 800 }: Props) => {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const diff = value - start;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    prev.current = value;
  }, [value, duration]);

  return (
    <motion.span
      key={value}
      initial={{ scale: 1.1 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      ₹{display}
    </motion.span>
  );
};

export default AnimatedCounter;
