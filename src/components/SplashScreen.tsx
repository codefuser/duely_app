import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Props {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: Props) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onFinish, 500);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(135deg, hsl(168, 76%, 42%), hsl(190, 70%, 40%))' }}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center gap-3"
      >
        <div className="w-20 h-20 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
          <span className="text-4xl">💰</span>
        </div>
        <h1 className="text-3xl font-extrabold text-primary-foreground tracking-tight">Duely</h1>
        <p className="text-primary-foreground/70 text-sm font-medium">Track Your Dues</p>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
