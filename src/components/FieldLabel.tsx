import { cn } from '@/lib/utils'

type FieldLabelProps = {
  htmlFor?: string
  children: React.ReactNode
  required?: boolean
  className?: string
}

export function FieldLabel({ htmlFor, children, required = true, className }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('text-xs font-medium uppercase tracking-wide text-muted-foreground', className)}
    >
      {children}{' '}
      <span className="text-muted-foreground">
        {required ? '*' : '(facultatif)'}
      </span>
    </label>
  )
}
