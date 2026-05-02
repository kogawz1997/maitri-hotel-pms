'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Calendar, Users, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'หน้าหลัก' },
  { href: '/dashboard/inbox', icon: MessageSquare, label: 'Inbox' },
  { href: '/dashboard/reservations', icon: Calendar, label: 'จอง' },
  { href: '/dashboard/guests', icon: Users, label: 'แขก' },
  { href: '/dashboard/menu', icon: Menu, label: 'เพิ่มเติม' },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur-xl">
      <div className="flex items-center justify-around">
        {ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-3 text-2xs',
                isActive ? 'text-accent' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
