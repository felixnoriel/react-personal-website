import { trackTechClick } from '../utils/analytics';
import { memo } from 'react';

interface SkillBubbleProps {
  name: string;
  tags?: string[];
  size: 'small' | 'medium' | 'large';
  color: 'blue' | 'green' | 'orange';
  compact?: boolean;
  icon?: string;
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
    text: 'text-blue-600',
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

// Variants for staggered entrance - Simplified to just fade in if needed
export const itemVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

export const SkillBubble = memo(({ name, tags, size, color, compact = false, icon }: SkillBubbleProps) => {
  const sizeClass = sizeClasses[size];
  const colorClass = colorClasses[color];

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
      <div
        onMouseEnter={() => trackTechClick(name, 'compact_bubble')}
        className={`inline-flex items-center gap-2 ${sizeClass.bubble} ${colorClass.bg} ${colorClass.text} border ${colorClass.bg.split(' ')[2]} rounded-full backdrop-blur-sm cursor-default transition-transform hover:scale-105 hover:-translate-y-0.5`}
      >
        {renderIconOrDot()}
        <span className="font-medium">{name}</span>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => trackTechClick(name, 'full_bubble')}
      className={`flex items-start gap-3 ${sizeClass.bubble} ${colorClass.bg} border ${colorClass.bg.split(' ')[2]} rounded-2xl backdrop-blur-sm cursor-default w-full transition-transform hover:scale-[1.02] hover:-translate-y-0.5`}
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
    </div>
  );
});

// For better debugging display name
SkillBubble.displayName = 'SkillBubble';
