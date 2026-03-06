import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { SuperAdminHeader } from '../components/SuperAdminHeader'
import { listAllNotifications, listNotifications, markNotificationRead, type NotificationDTO } from '@/services/api/notifications.api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function NotificationsDashboard() {
  const navigate = useNavigate()
  const { user, impersonation } = useAuth()
  const role = String(user?.role || '').toUpperCase()
  const requiresSecondAuth = role === 'SUPER_ADMIN' && user?.superAdminSecondAuthRequired !== false
  const canReadAdminScopedData = role !== 'SUPER_ADMIN' || Boolean(impersonation?.adminId)
  const canReadNotifications = Boolean(user?.id) && !requiresSecondAuth && canReadAdminScopedData
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationDTO[]>([])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  )

  const load = useCallback(async () => {
    if (!canReadNotifications) {
      setNotifications([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = role === 'SUPER_ADMIN' ? await listAllNotifications() : await listNotifications(user.id)
      setNotifications(Array.isArray(data) ? data : [])
    } catch (error) {
      const message = String((error as { message?: string })?.message || '').toLowerCase()
      if (message.includes('seconde authentification super admin requise')) {
        window.dispatchEvent(new CustomEvent('super-admin-second-auth-required'))
      }
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [canReadNotifications, role, user?.id])

  useEffect(() => {
    void load()
  }, [load])

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
    <main className="mx-auto w-full max-w-6xl space-y-4 px-3 py-4 animate-fade-in sm:space-y-6 sm:px-4 sm:py-6 lg:px-6">
      <SectionWrapper>
        <SuperAdminHeader />
      </SectionWrapper>

      <SectionWrapper>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#121B53]">Notifications</h2>
            <p className="text-sm text-muted-foreground">Alertes et activités récentes</p>
          </div>
          <Button
            variant="outline"
            className="w-full border-[#121B53]/20 text-[#121B53] sm:w-auto"
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
                      navigate('/pmt/admin?section=demandes-en-attente')
                    } else if (notif.type === 'SECURITY_ALERT') {
                      navigate('/pmt/admin/monitoring/requests')
                    }
                  }}
                  className={cn(
                    'w-full px-3 py-4 text-left transition sm:px-5',
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
