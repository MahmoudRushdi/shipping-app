import { motion } from 'framer-motion';
import { useState } from 'react';

export default function AnimatedCard({ 
  children, 
  className = "", 
  delay = 0, 
  hover = true, 
  onClick,
  variant = "default" 
}) {
  const [isHovered, setIsHovered] = useState(false);

  const variants = {
    default: {
      initial: { opacity: 0, y: 20, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      hover: { 
        y: -5, 
        scale: 1.02,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }
    },
    glass: {
      initial: { opacity: 0, y: 20, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      hover: { 
        y: -5, 
        scale: 1.02,
        backdropFilter: "blur(20px)",
        backgroundColor: "rgba(255, 255, 255, 0.25)"
      }
    },
    gradient: {
      initial: { opacity: 0, y: 20, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      hover: { 
        y: -5, 
        scale: 1.02,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }
    }
  };

  const baseClasses = {
    default: "bg-white rounded-xl shadow-lg border border-gray-100",
    glass: "bg-white/20 backdrop-blur-md rounded-xl shadow-lg border border-white/30",
    gradient: "bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg border border-blue-200"
  };

  return (
    <motion.div
      className={`${baseClasses[variant]} ${className}`}
      variants={variants[variant]}
      initial="initial"
      animate="animate"
      whileHover={hover ? "hover" : undefined}
      transition={{
        duration: 0.3,
        delay: delay * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </motion.div>
  );
} 