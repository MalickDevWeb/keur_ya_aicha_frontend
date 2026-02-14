import { CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

type DashboardEmptyStateSectionProps = {
  title: string
  description: string
}

export function DashboardEmptyStateSection({ title, description }: DashboardEmptyStateSectionProps) {
  return (
    <div className="relative overflow-hidden">
      <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">{title}</h3>
              <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
