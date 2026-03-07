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
      card: 'border-[#B8D4FF] bg-[#EDF5FF]',
      icon: 'bg-[#C6D8FF] text-[#4939F5]',
      accent: 'bg-[#2C44B6]',
    },
    success: {
      card: 'border-[#9BE7BE] bg-[#EAFBF0]',
      icon: 'bg-[#B8F0CC] text-[#16A34A]',
      accent: 'bg-[#16A34A]',
    },
    warning: {
      card: 'border-[#E7D778] bg-[#FFF8E7]',
      icon: 'bg-[#F4E58E] text-[#D97706]',
      accent: 'bg-[#D97706]',
    },
    danger: {
      card: 'border-[#F0B9C1] bg-[#FFF1F3]',
      icon: 'bg-[#FFD6DB] text-[#EF4444]',
      accent: 'bg-[#EF4444]',
    },
  };

  const config = variantConfig[variant];

  return (
    <Card
      className={cn(
        'relative overflow-hidden rounded-[20px] border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(18,27,83,0.12)]',
        config.card,
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className="absolute right-0 top-0 h-20 w-20 opacity-20">
        <div className="h-full w-full rounded-full bg-white/60 blur-2xl" />
      </div>

      <CardContent className="p-3 sm:p-4 relative z-10">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5D73A8] truncate">
              {title}
            </p>
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-black tracking-tight text-[#121B53] break-words">
                {isCurrency ? (
                  <>
                    {formatCurrency(value).slice(0, -4)}{' '}
                    <span className="text-sm font-black text-[#33469B] sm:text-base">
                      K
                    </span>
                  </>
                ) : (
                  value
                )}
              </p>
              {isCurrency && (
                <p className="text-xs font-medium text-[#5D73A8]">FCFA</p>
              )}
            </div>
          </div>
          <div
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl sm:h-12 sm:w-12',
              config.icon
            )}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className={cn('mt-3 h-1 w-10 rounded-full', config.accent)} />
      </CardContent>
    </Card>
  );
}
