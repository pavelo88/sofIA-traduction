"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, MessageSquare, BookOpen, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'AR Lens', href: '/lens', icon: Camera },
  { name: 'Kitten Tutor', href: '/chat', icon: MessageSquare },
  { name: 'Lectura', href: '/reading', icon: BookOpen },
  { name: 'Review', href: '/', icon: BarChart3 },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-6 md:top-1/2 md:-translate-y-1/2 md:translate-x-0 z-50">
      <div className="glass-panel rounded-full md:rounded-3xl p-2 flex md:flex-col gap-2 border-white/5 shadow-primary/10 shadow-2xl">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "p-4 rounded-full md:rounded-2xl transition-all squish-effect group relative",
                isActive ? "bg-primary text-white" : "text-muted-foreground hover:text-primary hover:bg-white/5"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="absolute left-full ml-4 px-2 py-1 bg-popover text-white text-xs rounded opacity-0 group-hover:opacity-100 hidden md:block transition-opacity whitespace-nowrap">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
