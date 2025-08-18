import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function AnimatedStats({ 
  title, 
  value, 
  icon: Icon, 
  color = "blue", 
  delay = 0,
  formatValue = (val) => val,
  trend = null 
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Update immediately when value changes
    setDisplayValue(value);
  }, [value]);

  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600", 
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    red: "from-red-500 to-red-600",
    indigo: "from-indigo-500 to-indigo-600"
  };

  const iconColors = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600", 
    orange: "text-orange-600",
    red: "text-red-600",
    indigo: "text-indigo-600"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: delay * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        y: -5, 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 relative overflow-hidden group"
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]} bg-opacity-10`}>
            {Icon && <Icon className={`w-6 h-6 ${iconColors[color]}`} />}
          </div>
          {trend && (
            <div className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <motion.div 
            className="text-2xl font-bold text-gray-900"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay * 0.1 + 0.2, duration: 0.3 }}
          >
            {formatValue(displayValue)}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
} 