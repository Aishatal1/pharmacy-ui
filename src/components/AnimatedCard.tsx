// src/components/AnimatedCard.tsx

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  children, 
  delay = 0,
  className 
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay: delay,
        ease: 'easeOut' 
      }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        transition: { duration: 0.2 }
      }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;