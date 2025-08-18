import { motion } from 'framer-motion';
import { useState } from 'react';

export default function AnimatedButton({ 
  children, 
  onClick, 
  variant = "primary", 
  size = "md",
  disabled = false,
  loading = false,
  className = "",
  icon: Icon,
  ...props 
}) {
  const [isPressed, setIsPressed] = useState(false);

  const variants = {
    primary: {
      initial: { scale: 1 },
      hover: { scale: 1.05, y: -2 },
      tap: { scale: 0.95 },
      disabled: { scale: 1, opacity: 0.5 }
    },
    secondary: {
      initial: { scale: 1 },
      hover: { scale: 1.05, y: -2 },
      tap: { scale: 0.95 },
      disabled: { scale: 1, opacity: 0.5 }
    },
    outline: {
      initial: { scale: 1 },
      hover: { scale: 1.05, y: -2 },
      tap: { scale: 0.95 },
      disabled: { scale: 1, opacity: 0.5 }
    }
  };

  const baseClasses = {
    primary: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg hover:shadow-xl",
    outline: "bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white"
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <motion.button
      className={`
        ${baseClasses[variant]} 
        ${sizeClasses[size]} 
        ${className}
        font-semibold rounded-lg transition-all duration-200
        flex items-center justify-center gap-2
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
      variants={variants[variant]}
      initial="initial"
      whileHover={disabled ? "disabled" : "hover"}
      whileTap={disabled ? "disabled" : "tap"}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      {...props}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
        />
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4" />}
          {children}
        </>
      )}
    </motion.button>
  );
} 