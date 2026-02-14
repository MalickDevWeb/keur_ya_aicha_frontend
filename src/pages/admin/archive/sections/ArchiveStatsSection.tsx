import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ArchiveStatsSectionProps = {
  archived: number
  blacklisted: number
}

export function ArchiveStatsSection({ archived, blacklisted }: ArchiveStatsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Clients Archivés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{archived}</div>
          <p className="text-xs text-muted-foreground mt-1">Inactifs</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Blacklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">{blacklisted}</div>
          <p className="text-xs text-muted-foreground mt-1">Bloqués</p>
        </CardContent>
      </Card>
    </div>
  )
}
