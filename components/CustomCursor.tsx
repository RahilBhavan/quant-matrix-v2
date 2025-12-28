import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export const CustomCursor: React.FC = () => {
  // Performance Optimization: Use MotionValues instead of State to avoid re-rendering React component on every mouse move.
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  
  // Smooth spring animation for the trailing effect
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      // Directly update motion values
      mouseX.set(e.clientX - 10);
      mouseY.set(e.clientY - 10);
      
      // Check hover state (this still needs state, but runs less frequently than position updates conceptually)
      const target = e.target as HTMLElement;
      // Optimize selector check using matches or closest with specific classes
      const isInteractive = !!target.closest('button, a, input, .interactive-zone');
      setIsHovering(isInteractive);
    };

    window.addEventListener('mousemove', updateMousePosition, { passive: true });
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
      style={{
        x: cursorX,
        y: cursorY,
      }}
    >
      <motion.div 
        animate={{
            scale: isHovering ? 2.5 : 1,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
        className={`
        relative flex items-center justify-center
        transition-colors duration-300
        ${isHovering ? 'w-5 h-5 bg-white' : 'w-5 h-5 border border-white bg-transparent rounded-full'}
      `}>
         {/* The Singularity Point */}
         <div className={`absolute w-[2px] h-[2px] bg-white rounded-full transition-opacity duration-200 ${isHovering ? 'opacity-0' : 'opacity-100'}`} />
      </motion.div>
    </motion.div>
  );
};