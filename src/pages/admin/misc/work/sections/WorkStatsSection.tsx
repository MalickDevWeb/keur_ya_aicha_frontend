import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type WorkStatsSectionProps = {
  pending: number
  completed: number
}

export function WorkStatsSection({ pending, completed }: WorkStatsSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">En attente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{pending}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Complétés</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{completed}</p>
        </CardContent>
      </Card>
    </div>
  )
}
