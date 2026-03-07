import { CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

type DashboardEmptyStateSectionProps = {
  title: string
  description: string
}

export function DashboardEmptyStateSection({ title, description }: DashboardEmptyStateSectionProps) {
  return (
    <div className="relative overflow-hidden">
      <Card className="border-[#9BE7BE] bg-[#EAFBF0] shadow-[0_14px_36px_rgba(22,163,74,0.08)]">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80">
                <CheckCircle className="h-8 w-8 text-[#16A34A]" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[#16A34A]">{title}</h3>
              <p className="mt-1 text-sm text-[#2F8F5B]">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
