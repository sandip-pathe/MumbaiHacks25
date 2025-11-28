import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = false, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-bgCard/60 backdrop-blur-lg border border-white/5 rounded-2xl p-6 relative overflow-hidden
        transition-all duration-300 ease-out
        ${hoverEffect ? 'hover:scale-[1.01] hover:border-white/10 hover:shadow-[0_0_20px_rgba(196,181,253,0.15)] cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Subtle Gradient overlay for depth */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};