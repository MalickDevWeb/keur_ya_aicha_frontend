import { cn } from '@/lib/utils';
import { PaymentStatus, ClientStatus } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

interface BadgeStatutProps {
  status: PaymentStatus | ClientStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BadgeStatut({ status, size = 'md', className }: BadgeStatutProps) {
  const { t } = useI18n();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const statusConfig: Record<PaymentStatus | ClientStatus, { label: string; className: string }> = {
    paid: {
      label: t('status.paid'),
      className: 'bg-secondary text-secondary-foreground',
    },
    partial: {
      label: t('status.partial'),
      className: 'bg-accent text-accent-foreground',
    },
    unpaid: {
      label: t('status.unpaid'),
      className: 'bg-primary text-primary-foreground',
    },
    late: {
      label: t('status.late'),
      className: 'bg-destructive text-destructive-foreground',
    },
    active: {
      label: t('status.active'),
      className: 'bg-success text-success-foreground',
    },
    archived: {
      label: t('status.archived'),
      className: 'bg-muted text-muted-foreground',
    },
    blacklisted: {
      label: t('status.blacklisted'),
      className: 'bg-destructive text-destructive-foreground',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        sizeClasses[size],
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
