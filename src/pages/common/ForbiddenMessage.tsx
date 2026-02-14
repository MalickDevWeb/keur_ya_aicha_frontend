import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ForbiddenMessageProps = {
  title?: string
  message?: string
}

export function ForbiddenMessage({
  title = 'Accès refusé',
  message = "Vous n'avez pas les droits pour accéder à cette page.",
}: ForbiddenMessageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  )
}
