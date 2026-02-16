import { useEffect, useMemo, useState } from 'react'
import { Bell } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { listAllNotifications, listNotifications, markNotificationRead } from '@/services/api/notifications.api'

type NotificationItem = {
  id: string | number
  user_id: string
  type?: string
  message: string
  is_read?: boolean
  created_at?: string
}

export function NotificationBell() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  )

  const refresh = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      let data = role === 'SUPER_ADMIN' ? await listAllNotifications() : await listNotifications(user.id)
      if (!Array.isArray(data) && user?.id) {
        data = await listNotifications(user.id)
      }
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
        : []
      setNotifications(sorted)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!mounted) return
      await refresh()
    }
    run()
    const interval = setInterval(run, 8000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [user?.id])

  useEffect(() => {
    if (open) refresh()
  }, [open])

  const handleMarkRead = async (notif: NotificationItem) => {
    if (notif.is_read) return
    try {
      await markNotificationRead(notif.id)
      setNotifications((prev) =>
        prev.map((item) => (item.id === notif.id ? { ...item, is_read: true } : item))
      )
    } catch {
      // ignore
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative text-white/80 hover:text-white hover:bg-white/10"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#4A7CFF] px-1 text-[11px] font-semibold text-white shadow">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[320px] rounded-2xl border-[#121B53]/10 bg-white p-0 shadow-2xl"
      >
        <div className="border-b border-[#121B53]/10 px-4 py-3">
          <p className="text-sm font-semibold text-[#121B53]">Notifications</p>
          <p className="text-xs text-muted-foreground">Dernières alertes système</p>
        </div>
        <div className="max-h-[320px] overflow-auto">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">Chargement...</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Aucune notification pour le moment.
            </div>
          ) : (
            notifications.map((notif) => (
              <button
                key={notif.id}
                type="button"
                onClick={() => {
                  handleMarkRead(notif)
                  if (notif.type === 'ADMIN_REQUEST') {
                    navigate('/pmt/admin?section=demandes-en-attente')
                  } else if (notif.type === 'SECURITY_ALERT') {
                    navigate('/pmt/admin/monitoring/requests')
                  }
                }}
                className={cn(
                  'flex w-full items-start gap-3 px-4 py-3 text-left transition',
                  notif.is_read ? 'bg-white' : 'bg-[#F5F7FF]',
                  'hover:bg-[#EEF2FF]'
                )}
              >
                <span
                  className={cn(
                    'mt-1 h-2 w-2 rounded-full',
                    notif.is_read ? 'bg-transparent' : 'bg-[#4A7CFF]'
                  )}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#121B53]">{notif.message}</p>
                  {notif.created_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
