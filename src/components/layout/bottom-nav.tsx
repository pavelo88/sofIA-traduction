
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Camera, BookOpen, Mic2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProfileModal } from '@/components/ProfileModal';

/**
 * @summary Navegación inferior Minimalista Refactorizada.
 * Se han eliminado elementos invasivos para mantener una estética de barra bento limpia.
 */
const navItems = [
  { name: 'Inicio', href: '/', icon: Home },
  { name: 'Lente AR', href: '/lens', icon: Camera },
  { name: 'Lectura', href: '/reading', icon: BookOpen },
  { name: 'Hablar', href: '/conversacion', icon: Mic2 },
];

export function BottomNav() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md lg:hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="glass-panel rounded-full h-14 px-6 flex justify-between items-center border-white/5 bg-black/60 backdrop-blur-3xl shadow-2xl">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "p-2 rounded-full transition-all duration-300 squish-effect group relative",
                isActive ? "text-primary" : "text-white/40 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_rgba(161,98,247,0.8)]")} />
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}

        <div className="h-6 w-px bg-white/5 mx-2" />

        <ProfileModal>
          <button className="p-2 rounded-full text-white/40 hover:text-white transition-colors squish-effect">
            <User className="w-5 h-5" />
          </button>
        </ProfileModal>
      </div>
    </nav>
  );
}
