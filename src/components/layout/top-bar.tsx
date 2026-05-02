'use client';

import { Bell, Plus, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopBarProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function TopBar({ title, description, action }: TopBarProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        {action}
      </div>
    </div>
  );
}
