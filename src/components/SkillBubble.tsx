import { motion } from 'framer-motion';

interface SkillBubbleProps {
  name: string;
  tags?: string[];
  size: 'small' | 'medium' | 'large';
  color: 'blue' | 'green' | 'orange';
  compact?: boolean;
  icon?: string; // Added icon support
}

const sizeClasses = {
  small: {
    bubble: 'px-3 py-1.5 text-xs',
    dot: 'w-1.5 h-1.5'
  },
  medium: {
    bubble: 'px-4 py-2 text-sm',
    dot: 'w-2 h-2'
  },
  large: {
    bubble: 'px-5 py-2.5 text-base',
    dot: 'w-2.5 h-2.5'
  }
};

const colorClasses = {
  blue: {
    bg: 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-400/40',
    text: 'text-blue-600', // Adjusted for light mode readability on existing bg
    dot: 'bg-blue-400',
    tag: 'bg-blue-400/30 text-blue-700'
  },
  green: {
    bg: 'bg-green-500/20 hover:bg-green-500/30 border-green-400/40',
    text: 'text-green-700',
    dot: 'bg-green-400',
    tag: 'bg-green-400/30 text-green-700'
  },
  orange: {
    bg: 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-400/40',
    text: 'text-orange-700',
    dot: 'bg-orange-400',
    tag: 'bg-orange-400/30 text-orange-700'
  }
};

export function SkillBubble({ name, tags, size, color, compact = false, icon }: SkillBubbleProps) {
  const sizeClass = sizeClasses[size];
  const colorClass = colorClasses[color];

  // If icon is provided, render it. Otherwise render the dot.
  const renderIconOrDot = () => {
    if (icon) {
      return <span className="text-lg leading-none">{icon}</span>;
    }
    return <div className={`${sizeClass.dot} ${colorClass.dot} rounded-full`}></div>;
  };

  const renderIconOrDotWrapper = () => {
      if (icon) {
          return <span className="text-lg leading-none mt-0.5 flex-shrink-0">{icon}</span>;
      }
      return <div className={`${sizeClass.dot} ${colorClass.dot} rounded-full flex-shrink-0 mt-1`}></div>
  }

  if (compact) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05, y: -2 }}
        transition={{ duration: 0.2 }}
        className={`inline-flex items-center gap-2 ${sizeClass.bubble} ${colorClass.bg} ${colorClass.text} border ${colorClass.bg.split(' ')[2]} rounded-full backdrop-blur-sm transition-all cursor-default`}
      >
        {renderIconOrDot()}
        <span className="font-medium">{name}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 ${sizeClass.bubble} ${colorClass.bg} border ${colorClass.bg.split(' ')[2]} rounded-2xl backdrop-blur-sm transition-all cursor-default w-full`}
    >
      <div className="flex items-center gap-2 flex-1">
        {renderIconOrDotWrapper()}
        <div className="flex-1">
          <div className={`${colorClass.text} font-bold`}>{name}</div>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-xs px-2 py-0.5 rounded-full ${colorClass.tag} font-medium`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
