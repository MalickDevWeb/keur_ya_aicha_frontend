import { Users, Home, CheckCircle, AlertCircle, Clock, Wallet } from 'lucide-react';
import { CardStat } from '@/components/CardStat';
import { useI18n } from '@/lib/i18n';
import { useData } from '@/contexts/DataContext';

export default function Dashboard() {
  const { t } = useI18n();
  const { stats } = useData();

  const statCards = [
    {
      title: t('dashboard.totalClients'),
      value: stats.totalClients,
      icon: Users,
      variant: 'default' as const,
    },
    {
      title: t('dashboard.totalRentals'),
      value: stats.totalRentals,
      icon: Home,
      variant: 'default' as const,
    },
    {
      title: t('dashboard.paidRentals'),
      value: stats.paidRentals,
      icon: CheckCircle,
      variant: 'success' as const,
    },
    {
      title: t('dashboard.unpaidRentals'),
      value: stats.unpaidRentals,
      icon: AlertCircle,
      variant: 'danger' as const,
    },
    {
      title: t('dashboard.partialRentals'),
      value: stats.partialRentals,
      icon: Clock,
      variant: 'warning' as const,
    },
    {
      title: t('dashboard.monthlyIncome'),
      value: stats.monthlyIncome,
      icon: Wallet,
      isCurrency: true,
      variant: 'default' as const,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('auth.welcome')}, Administrateur
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <CardStat
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            variant={stat.variant}
            isCurrency={stat.isCurrency}
            className="animate-fade-in"
          />
        ))}
      </div>
    </div>
  );
}
