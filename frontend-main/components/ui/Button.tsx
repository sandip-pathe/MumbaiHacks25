import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', icon, className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-heading font-semibold transition-all duration-300 active:scale-95";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary to-accent1 text-bgMain shadow-[0_0_15px_rgba(255,107,155,0.4)] hover:shadow-[0_0_25px_rgba(0,245,212,0.5)] hover:brightness-110",
    secondary: "bg-bgCard border border-white/10 text-white hover:bg-white/5 hover:border-white/20",
    outline: "bg-transparent border border-primary/50 text-primary hover:bg-primary/10"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
      {icon && <span className="ml-1">{icon}</span>}
    </button>
  );
};