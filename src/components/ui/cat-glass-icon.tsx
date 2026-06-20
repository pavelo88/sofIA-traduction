import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface CatGlassIconProps {
  icon: LucideIcon;
  isActive?: boolean;
  className?: string;
  iconClassName?: string;
  variant?: 'primary' | 'secondary' | 'green' | 'purple';
}

export function CatGlassIcon({ icon: Icon, isActive, className, iconClassName, variant = 'primary' }: CatGlassIconProps) {
  const variantStyles = {
    primary: "text-primary shadow-[0_0_15px_rgba(161,98,247,0.4)]",
    secondary: "text-secondary shadow-[0_0_15px_rgba(155,168,245,0.4)]",
    green: "text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]",
    purple: "text-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.4)]",
  };

  const activeStyle = isActive ? variantStyles[variant] : "text-white/50 bg-transparent shadow-none";

  return (
    <div className={cn("relative shrink-0 flex items-center justify-center transition-all duration-300 group rounded-xl", activeStyle, className)}>
      <Icon className={cn(
        "relative z-10 w-3/5 h-3/5 transition-transform duration-300",
        isActive ? "drop-shadow-[0_0_8px_currentColor] scale-110" : "group-hover:scale-110 group-hover:text-white",
        iconClassName
      )} />
    </div>
  );
}
