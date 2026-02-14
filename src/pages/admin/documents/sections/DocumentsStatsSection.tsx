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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{total}</p>
          {renderTotal(total, totalAll)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Contrats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{contracts}</p>
          {renderTotal(contracts, contractsAll)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Reçus</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{receipts}</p>
          {renderTotal(receipts, receiptsAll)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Autres</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{others}</p>
          {renderTotal(others, othersAll)}
        </CardContent>
      </Card>
    </div>
  )
}
