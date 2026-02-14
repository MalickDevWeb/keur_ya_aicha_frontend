import { Card, CardContent } from '@/components/ui/card'

type WorkEmptySectionProps = {
  message: string
}

export function WorkEmptySection({ message }: WorkEmptySectionProps) {
  return (
    <Card>
      <CardContent className="text-center py-8">
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}
