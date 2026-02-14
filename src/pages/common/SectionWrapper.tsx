import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SectionWrapperProps = {
  children: ReactNode
  className?: string
  id?: string
}

export function SectionWrapper({ children, className, id }: SectionWrapperProps) {
  return (
    <div id={id} className={cn('space-y-4', className)}>
      {children}
    </div>
  )
}
