import { motion } from 'framer-motion';

export default function AnimatedLoader({ 
  type = "spinner", 
  size = "md", 
  color = "indigo",
  text = "جاري التحميل...",
  className = "" 
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const colorClasses = {
    indigo: "border-indigo-600",
    blue: "border-blue-600",
    green: "border-green-600",
    red: "border-red-600",
    purple: "border-purple-600",
    orange: "border-orange-600"
  };

  const textColorClasses = {
    indigo: "text-indigo-600",
    blue: "text-blue-600", 
    green: "text-green-600",
    red: "text-red-600",
    purple: "text-purple-600",
    orange: "text-orange-600"
  };

  const renderLoader = () => {
    switch (type) {
      case "spinner":
        return (
          <motion.div
            className={`${sizeClasses[size]} border-2 border-gray-300 border-t-2 border-t-current rounded-full ${colorClasses[color]}`}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        );
      
      case "dots":
        return (
          <div className="flex space-x-1 space-x-reverse">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`${sizeClasses[size].split(' ')[0]} ${sizeClasses[size].split(' ')[1]} bg-current rounded-full ${colorClasses[color].replace('border-', 'bg-')}`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        );
      
      case "pulse":
        return (
          <motion.div
            className={`${sizeClasses[size]} bg-current rounded-full ${colorClasses[color].replace('border-', 'bg-')}`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        );
      
      case "wave":
        return (
          <div className="flex space-x-1 space-x-reverse">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className={`w-1 bg-current ${colorClasses[color].replace('border-', 'bg-')}`}
                animate={{
                  height: ["20px", "40px", "20px"]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        );
      
      case "ring":
        return (
          <div className="relative">
            <motion.div
              className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full`}
            />
            <motion.div
              className={`${sizeClasses[size]} border-4 border-transparent border-t-current rounded-full absolute top-0 left-0 ${colorClasses[color]}`}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        );
      
      default:
        return (
          <motion.div
            className={`${sizeClasses[size]} border-2 border-gray-300 border-t-2 border-t-current rounded-full ${colorClasses[color]}`}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        );
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {renderLoader()}
      {text && (
        <motion.p
          className={`mt-4 text-sm font-medium ${textColorClasses[color]}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
} 