import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { LanguageSelector } from '@/components/LanguageSelector'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotificationBell } from './NotificationBell'

type SuperAdminHeaderProps = {
  className?: string
  actions?: ReactNode
  onAddAdmin?: () => void
}

export function SuperAdminHeader({ className, actions, onAddAdmin }: SuperAdminHeaderProps) {
  const navigate = useNavigate()

  const handleAddAdmin = () => {
    if (onAddAdmin) {
      onAddAdmin()
      return
    }
    sessionStorage.setItem('superadminOpenCreate', 'true')
    navigate('/pmt/admin')
  }

  return (
    <div
      className={cn(
        'rounded-[28px] border border-[#121B53]/20 bg-gradient-to-br from-[#121B53] via-[#121B53] to-[#0B153D] px-4 py-4 text-white shadow-[0_18px_45px_rgba(9,15,40,0.32)] sm:px-6 sm:py-5',
        'relative overflow-hidden',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_45%)]" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(74,124,255,0.25),transparent_65%)]" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-xs uppercase tracking-[0.35em] text-white/70">Super Admin</p>
          <h1 className="text-xl font-semibold leading-tight text-white sm:text-2xl break-words">
            Pilotage global des comptes et des validations
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            className="w-full bg-white/15 text-white hover:bg-white/25 sm:w-auto"
            onClick={handleAddAdmin}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un admin
          </Button>
          <NotificationBell />
          {actions}
          <LanguageSelector className="ml-auto sm:ml-0" />
        </div>
      </div>
    </div>
  )
}
