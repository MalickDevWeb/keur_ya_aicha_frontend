import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ArchivedStatsSectionProps = {
  archivedCount: number
  activeCount: number
  rentalsCount: number
}

export function ArchivedStatsSection({ archivedCount, activeCount, rentalsCount }: ArchivedStatsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Total Archivés</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-slate-900">{archivedCount}</p>
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
      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-emerald-600">Propriétés Archivées</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-emerald-900">{rentalsCount}</p>
        </CardContent>
      </Card>
    </div>
  )
}
