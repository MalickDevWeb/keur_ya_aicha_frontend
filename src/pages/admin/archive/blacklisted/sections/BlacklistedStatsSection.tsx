import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type BlacklistedStatsSectionProps = {
  blacklistedCount: number
  activeCount: number
  rentalsCount: number
}

export function BlacklistedStatsSection({ blacklistedCount, activeCount, rentalsCount }: BlacklistedStatsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-red-600">Clients Blacklistés</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-red-900">{blacklistedCount}</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-blue-600">Clients Actifs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-900">{activeCount}</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-orange-600">Propriétés Affectées</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-orange-900">{rentalsCount}</p>
        </CardContent>
      </Card>
    </div>
  )
}
