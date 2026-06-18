"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Camera, BookOpen, Mic2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProfileModal } from '@/components/ProfileModal';

/**
 * @summary Navegación inferior estilo Bento Grid con Glassmorphism 2.0.
 */
const navItems = [
  { name: 'Inicio', href: '/', icon: Home },
  { name: 'Lente AR', href: '/lens', icon: Camera },
  { name: 'Lectura', href: '/reading', icon: BookOpen },
  { name: 'Hablar', href: '/conversacion', icon: Mic2 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg">
      <div className="glass-panel rounded-full p-2 flex justify-around items-center border-white/10 shadow-primary/20 shadow-2xl bg-black/40 backdrop-blur-2xl">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-full transition-all duration-300 squish-effect group relative",
                isActive 
                  ? "bg-primary text-white scale-110 shadow-lg shadow-primary/40" 
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "animate-pulse")} />
              <span className={cn(
                "text-[9px] font-headline uppercase tracking-widest mt-1 opacity-0 transition-opacity",
                isActive && "opacity-100"
              )}>
                {item.name}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-white animate-fade-in" />
              )}
            </Link>
          );
        })}

        <div className="h-8 w-px bg-white/10 mx-2" />

        <ProfileModal>
          <button className="p-3 rounded-full text-muted-foreground hover:text-primary transition-colors squish-effect">
            <User className="w-5 h-5" />
          </button>
        </ProfileModal>
      </div>
    </nav>
  );
}
