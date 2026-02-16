import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type DocumentsStatsSectionProps = {
  total: number
  totalAll: number
  contracts: number
  contractsAll: number
  receipts: number
  receiptsAll: number
  others: number
  othersAll: number
  showTotals: boolean
}

export function DocumentsStatsSection({
  total,
  totalAll,
  contracts,
  contractsAll,
  receipts,
  receiptsAll,
  others,
  othersAll,
  showTotals,
}: DocumentsStatsSectionProps) {
  const renderTotal = (value: number, overall: number) =>
    showTotals ? (
      <p className="text-xs text-muted-foreground">/ {overall}</p>
    ) : null

  const stats = [
    { label: 'Total', value: total, overall: totalAll },
    { label: 'Contrats', value: contracts, overall: contractsAll },
    { label: 'Reçus', value: receipts, overall: receiptsAll },
    { label: 'Autres', value: others, overall: othersAll },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-[#121B53]/10">
          <CardHeader className="space-y-0 px-3 pb-1 pt-3 sm:px-4 sm:pb-2 sm:pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">{stat.label}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
            <p className="text-xl font-bold text-[#121B53] sm:text-2xl">{stat.value}</p>
            {renderTotal(stat.value, stat.overall)}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
