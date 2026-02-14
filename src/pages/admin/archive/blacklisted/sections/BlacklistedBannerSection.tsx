import { AlertTriangle } from 'lucide-react'

export function BlacklistedBannerSection() {
  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex gap-3">
      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-destructive">Liste Noire Active</p>
        <p className="text-sm text-destructive/80">
          Les clients listés ici sont bloqués et ne peuvent pas louer. Utilisez avec prudence.
        </p>
      </div>
    </div>
  )
}
