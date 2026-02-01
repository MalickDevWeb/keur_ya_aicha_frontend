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
  const variantClasses = {
    default: 'border-l-secondary',
    success: 'border-l-success',
    warning: 'border-l-warning',
    danger: 'border-l-destructive',
  };

  const iconVariantClasses = {
    default: 'bg-highlight text-secondary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-destructive/10 text-destructive',
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-l-4 transition-all duration-200',
        variantClasses[variant],
        onClick && 'cursor-pointer hover:shadow-md hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">
              {isCurrency ? (
                <>
                  {formatCurrency(value)}{' '}
                  <span className="text-sm font-normal text-muted-foreground">FCFA</span>
                </>
              ) : (
                value
              )}
            </p>
          </div>
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-full',
              iconVariantClasses[variant]
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
