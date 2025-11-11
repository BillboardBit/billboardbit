import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Main layout wrapper component
 */
export function MainLayout({ children, className }: LayoutProps) {
  return (
    <main className={cn('flex-1 w-full', className)}>
      {children}
    </main>
  );
}

/**
 * Container component for consistent spacing
 */
export function Container({ children, className }: LayoutProps) {
  return (
    <div className={cn('container mx-auto px-4 py-8 md:px-8 md:py-12', className)}>
      {children}
    </div>
  );
}

/**
 * Page header component
 */
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 md:flex-row md:items-center md:justify-between', className)}>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
