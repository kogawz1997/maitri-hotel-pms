'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Calendar, MessageSquare, Users, Bed,
  Sparkles, BarChart3, Receipt, Globe2, UtensilsCrossed,
  Heart, Award, Megaphone, Settings, LogOut, ChevronDown,
  Building2, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  hotelName: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
}

const NAV_GROUPS = [
  {
    label: 'ภาพรวม',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
      { href: '/dashboard/inbox', icon: MessageSquare, label: 'Inbox', badge: true },
    ],
  },
  {
    label: 'การดำเนินงาน',
    items: [
      { href: '/dashboard/reservations', icon: Calendar, label: 'การจอง' },
      { href: '/dashboard/rooms', icon: Bed, label: 'ห้อง' },
      { href: '/dashboard/guests', icon: Users, label: 'แขก' },
      { href: '/dashboard/housekeeping', icon: Sparkles, label: 'แม่บ้าน' },
    ],
  },
  {
    label: 'การจัดจำหน่าย',
    items: [
      { href: '/dashboard/channels', icon: Globe2, label: 'Channel Manager' },
      { href: '/dashboard/marketing', icon: Megaphone, label: 'Marketing' },
    ],
  },
  {
    label: 'การเงิน',
    items: [
      { href: '/dashboard/accounting', icon: Receipt, label: 'บัญชี & ภาษี' },
      { href: '/dashboard/reports', icon: BarChart3, label: 'รายงาน' },
    ],
  },
  {
    label: 'ส่วนเสริม',
    items: [
      { href: '/dashboard/fb', icon: UtensilsCrossed, label: 'F&B' },
      { href: '/dashboard/spa', icon: Heart, label: 'Spa' },
      { href: '/dashboard/loyalty', icon: Award, label: 'Loyalty' },
    ],
  },
];

export function Sidebar({ hotelName, userName, userEmail, userRole }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
      {/* Logo & Property */}
      <div className="p-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
              <path d="M4 20V4h4l4 8 4-8h4v16h-3V9l-3 6h-4L7 9v11H4z" fill="currentColor"/>
            </svg>
          </div>
          <span className="font-display text-lg font-medium tracking-tight">Maitri</span>
        </Link>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg hover:bg-secondary transition-colors group">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium truncate flex-1">{hotelName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Quick search */}
      <div className="p-3">
        <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground border border-border rounded-md hover:bg-secondary transition-colors">
          <Search className="h-3 w-3" />
          <span className="flex-1 text-left">ค้นหา...</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-secondary rounded">⌘K</kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-3 mb-1 text-2xs uppercase tracking-widest text-muted-foreground/70 font-medium">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors group',
                      isActive
                        ? 'bg-secondary text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    )}
                  >
                    <item.icon className={cn('h-4 w-4', isActive && 'text-accent')} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="text-2xs px-1.5 rounded bg-accent/10 text-accent" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-border p-3">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors',
            pathname.startsWith('/dashboard/settings') && 'bg-secondary'
          )}
        >
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
            {(userName || userEmail || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{userName || userEmail}</div>
            <div className="text-2xs text-muted-foreground truncate">{userRole || 'staff'}</div>
          </div>
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
        <form action="/api/auth/logout" method="post" className="mt-1">
          <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
            <LogOut className="h-3.5 w-3.5" />
            ออกจากระบบ
          </button>
        </form>
      </div>
    </aside>
  );
}
