"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Camera, BookOpen, Mic2, MessageSquare, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CatGlassIcon } from '@/components/ui/cat-glass-icon';
import { ProfileModal } from '@/components/ProfileModal';

const navItems = [
  { name: 'Conversación', href: '/', icon: Mic2 },
  { name: 'Lente AR', href: '/lens', icon: Camera },
  { name: 'Documentos', href: '/documents', icon: BookOpen },
  { name: 'Amigo SoftIA', href: '/chat', icon: MessageSquare },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col fixed left-6 top-6 bottom-6 w-64 z-40 animate-in fade-in slide-in-from-left-4 duration-700">
      <div className="glass-panel w-full h-full rounded-[2.5rem] p-6 flex flex-col justify-between border-white/5 bg-black/60 backdrop-blur-3xl shadow-2xl">
        
        {/* LOGO SECTION */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-headline font-bold text-lg tracking-tight text-white leading-none">SoftIA</h1>
              <span className="text-[8px] font-headline text-white/40 uppercase tracking-[0.2em]">Traduction v3.0</span>
            </div>
          </div>
          <div className="h-px bg-white/5" />
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 py-8 space-y-4">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href;
            const variants: ('primary' | 'secondary' | 'green' | 'purple')[] = ['primary', 'secondary', 'green', 'purple', 'primary'];
            
            return (
              <Link key={item.name} href={item.href}>
                <button
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-2 rounded-2xl transition-all duration-300 group relative overflow-visible",
                    isActive ? "bg-white/5 border border-white/5" : "hover:bg-white/[0.02]"
                  )}
                >
                  <CatGlassIcon 
                    icon={item.icon} 
                    isActive={isActive} 
                    className="w-12 h-12" 
                    variant={variants[index % variants.length]} 
                  />
                  <span className={cn(
                    "text-xs font-headline uppercase tracking-widest transition-colors duration-300",
                    isActive ? "text-white font-bold" : "text-white/40 group-hover:text-white/80"
                  )}>
                    {item.name}
                  </span>
                </button>
              </Link>
            );
          })}
        </nav>

        {/* FOOTER & PROFILE SECTION */}
        <div className="space-y-6">
          <div className="h-px bg-white/5" />
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] font-headline text-white/40 uppercase tracking-widest font-bold">Núcleo IA</span>
              <span className="text-[10px] font-headline text-white/60 lowercase tracking-wider">soft-ia-traduction</span>
            </div>

            <ProfileModal>
              <button className="p-3 rounded-2xl bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 squish-effect flex items-center justify-center">
                <User className="w-4 h-4" />
              </button>
            </ProfileModal>
          </div>
        </div>

      </div>
    </aside>
  );
}
