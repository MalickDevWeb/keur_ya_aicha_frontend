import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type SignedContractsStatsSectionProps = {
  total: number
  properties: number
  revenueLabel: string
}

export function SignedContractsStatsSection({ total, properties, revenueLabel }: SignedContractsStatsSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Total Contrats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{total}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Propriétés</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{properties}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Revenu Mensuel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{revenueLabel}</p>
          <p className="text-xs text-muted-foreground">XOF</p>
        </CardContent>
      </Card>
    </div>
  )
}
