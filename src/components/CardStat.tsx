import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/types';

interface CardStatProps {
  title: string;
  value: number;
  icon: LucideIcon;
  isCurrency?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
  className?: string;
}

export function CardStat({
  title,
  value,
  icon: Icon,
  isCurrency = false,
  variant = 'default',
  onClick,
  className,
}: CardStatProps) {
  const variantConfig = {
    default: {
      bg: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-600 dark:text-blue-400',
      accent: 'text-blue-600 dark:text-blue-400',
    },
    success: {
      bg: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
      border: 'border-green-200 dark:border-green-800',
      icon: 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 text-green-600 dark:text-green-400',
      accent: 'text-green-600 dark:text-green-400',
    },
    warning: {
      bg: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      icon: 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 text-amber-600 dark:text-amber-400',
      accent: 'text-amber-600 dark:text-amber-400',
    },
    danger: {
      bg: 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30',
      border: 'border-red-200 dark:border-red-800',
      icon: 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 text-red-600 dark:text-red-400',
      accent: 'text-red-600 dark:text-red-400',
    },
  };

  const config = variantConfig[variant];

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300 border hover:shadow-md hover:scale-102 backdrop-blur-sm',
        `bg-gradient-to-br ${config.bg}`,
        config.border,
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Decorative gradient background */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-5 dark:opacity-10">
        <div className={cn('w-full h-full rounded-full bg-gradient-to-br', config.bg)} />
      </div>

      <CardContent className="p-3 sm:p-4 relative z-10">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {title}
            </p>
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight break-words">
                {isCurrency ? (
                  <>
                    {formatCurrency(value).slice(0, -4)}{' '}
                    <span className={cn('text-sm sm:text-base font-bold', config.accent)}>
                      K
                    </span>
                  </>
                ) : (
                  value
                )}
              </p>
              {isCurrency && (
                <p className="text-xs text-muted-foreground font-medium">FCFA</p>
              )}
            </div>
          </div>
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex-shrink-0',
              config.icon
            )}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Bottom accent line */}
        <div className={cn('h-0.5 w-8 rounded-full mt-3', config.accent)} />
      </CardContent>
    </Card>
  );
}
