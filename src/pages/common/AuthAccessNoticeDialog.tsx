import { Mail, MessageCircle, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export type AuthAccessNoticeKind = 'pending' | 'denied'

const SUPPORT_PHONE_DISPLAY = '77 171 90 13'
const SUPPORT_PHONE_LINK = 'https://wa.me/221771719013'
const SUPPORT_EMAIL = 'malickteuw.devweb@gmail.com'

type AuthAccessNoticeDialogProps = {
  open: boolean
  notice: AuthAccessNoticeKind | null
  onOpenChange: (open: boolean) => void
}

export function AuthAccessNoticeDialog({ open, notice, onOpenChange }: AuthAccessNoticeDialogProps) {
  if (!notice) return null

  const isDenied = notice === 'denied'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-md p-0 overflow-hidden">
        <div className={isDenied ? 'bg-[#121B53] px-5 py-4 text-white' : 'bg-[#F7F9FF] px-5 py-4 text-[#121B53]'}>
          <div className="flex items-start gap-3">
            <div
              className={
                isDenied
                  ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/12'
                  : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#121B53]/10'
              }
            >
              <ShieldAlert className="h-5 w-5" />
            </div>
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className={isDenied ? 'text-white' : 'text-[#121B53]'}>
                {isDenied ? "Vous n'avez pas accès" : 'Compte en attente'}
              </DialogTitle>
              <DialogDescription className={isDenied ? 'text-white/80' : 'text-[#121B53]/70'}>
                {isDenied
                  ? "Veuillez contacter le Super Administrateur pour rétablir l'accès à votre compte."
                  : "Votre demande est en attente d'approbation du Super Admin. Vous pourrez vous connecter après validation."}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {isDenied ? (
          <div className="space-y-3 px-5 py-4">
            <p className="text-sm text-slate-600">Contact du Super Administrateur</p>
            <div className="grid gap-3">
              <a
                href={SUPPORT_PHONE_LINK}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl border border-[#121B53]/10 bg-[#F8FAFF] px-3 py-3 text-sm text-[#121B53] transition hover:border-[#121B53]/25 hover:bg-[#F1F5FF]"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span>WhatsApp: {SUPPORT_PHONE_DISPLAY}</span>
              </a>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="flex items-center gap-3 rounded-xl border border-[#121B53]/10 bg-white px-3 py-3 text-sm text-[#121B53] transition hover:border-[#121B53]/25 hover:bg-slate-50"
              >
                <Mail className="h-4 w-4 shrink-0" />
                <span>Email: {SUPPORT_EMAIL}</span>
              </a>
            </div>
          </div>
        ) : null}

        <DialogFooter className="px-5 pb-5 pt-0">
          <Button className="w-full bg-[#121B53] text-white hover:bg-[#0B153D]" onClick={() => onOpenChange(false)}>
            Compris
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
