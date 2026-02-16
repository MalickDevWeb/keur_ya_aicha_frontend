import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 md:flex-row md:flex-wrap md:items-start md:justify-between', className)}>
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground break-words">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:flex-wrap md:items-center md:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
