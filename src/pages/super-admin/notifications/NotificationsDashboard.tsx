import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { SuperAdminHeader } from '../components/SuperAdminHeader'
import { listAllNotifications, listNotifications, markNotificationRead, type NotificationDTO } from '@/services/api/notifications.api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function NotificationsDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const role = String(user?.role || '').toUpperCase()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationDTO[]>([])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  )

  const load = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const data = role === 'SUPER_ADMIN' ? await listAllNotifications() : await listNotifications(user.id)
      setNotifications(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user?.id])

  const handleRead = async (notif: NotificationDTO) => {
    if (notif.is_read) return
    try {
      await markNotificationRead(notif.id)
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)))
    } catch {
      // ignore
    }
  }

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read)
    try {
      await Promise.all(unread.map((n) => markNotificationRead(n.id)))
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch {
      // ignore
    }
  }

  return (
    <main className="max-w-6xl mx-auto w-full px-6 py-6 space-y-6 animate-fade-in">
      <SectionWrapper>
        <SuperAdminHeader />
      </SectionWrapper>

      <SectionWrapper>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#121B53]">Notifications</h2>
            <p className="text-sm text-muted-foreground">Alertes et activités récentes</p>
          </div>
          <Button
            variant="outline"
            className="border-[#121B53]/20 text-[#121B53]"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            Tout marquer comme lu
          </Button>
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <div className="rounded-3xl border border-[#121B53]/10 bg-white/85 shadow-[0_20px_50px_rgba(12,18,60,0.12)]">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Chargement...</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Aucune notification pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-[#121B53]/10">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => {
                    handleRead(notif)
                    if (notif.type === 'ADMIN_REQUEST') {
                      navigate('/pmt/admin#demandes-en-attente')
                    } else if (notif.type === 'SECURITY_ALERT') {
                      navigate('/pmt/admin/monitoring/requests')
                    }
                  }}
                  className={cn(
                    'w-full px-5 py-4 text-left transition',
                    notif.is_read ? 'bg-white' : 'bg-[#F5F7FF]',
                    'hover:bg-[#EEF2FF]'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#121B53]">{notif.message}</p>
                      {notif.created_at && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    {!notif.is_read && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#4A7CFF]" />}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-[#121B53]/70">
                    <span>{notif.type === 'ADMIN_REQUEST' ? 'Demande admin' : notif.type || 'Notification'}</span>
                    {notif.type === 'ADMIN_REQUEST' ? (
                      <span className="font-semibold text-[#121B53]">Voir la demande →</span>
                    ) : notif.type === 'SECURITY_ALERT' ? (
                      <span className="font-semibold text-[#121B53]">Voir la surveillance →</span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </SectionWrapper>
    </main>
  )
}
