import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { CreatedAdmin } from '../types'

type CreateAdminDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  creating: boolean
  createError: string
  setCreateError: (value: string) => void
  newName: string
  setNewName: (value: string) => void
  newEmail: string
  setNewEmail: (value: string) => void
  newEntreprise: string
  setNewEntreprise: (value: string) => void
  newPassword: string
  setNewPassword: (value: string) => void
  newPhone: string
  setNewPhone: (value: string) => void
  createdAdmin: CreatedAdmin | null
  setCreatedAdmin: (value: CreatedAdmin | null) => void
  onCreate: () => void
  onDownloadPdf: (admin: CreatedAdmin) => void
  onSendWhatsapp: (admin: CreatedAdmin) => void
  pdfLoading: boolean
}

export function CreateAdminDialog({
  open,
  onOpenChange,
  creating,
  createError,
  setCreateError,
  newName,
  setNewName,
  newEmail,
  setNewEmail,
  newEntreprise,
  setNewEntreprise,
  newPassword,
  setNewPassword,
  newPhone,
  setNewPhone,
  createdAdmin,
  setCreatedAdmin,
  onCreate,
  onDownloadPdf,
  onSendWhatsapp,
  pdfLoading,
}: CreateAdminDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (nextOpen) {
          setCreateError('')
        }
      }}
    >
      <DialogContent className="overflow-hidden p-0 sm:max-w-[700px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Création d’un compte admin</DialogTitle>
          <DialogDescription>
            Formulaire de création et résumé des identifiants admin.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-gradient-to-r from-[#121B53] via-[#1D2D7A] to-[#3A58B7] p-4 text-white sm:p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[#BFD1FF]">Super Admin</p>
          <h2 className="mt-2 text-2xl font-semibold">
            {createdAdmin ? 'Compte créé' : 'Inscription directe'}
          </h2>
          <p className="mt-1 text-sm text-[#DCE7FF]">
            {createdAdmin
              ? 'Les identifiants sont prêts pour téléchargement ou envoi.'
              : 'Création instantanée d’un compte admin avec remise des identifiants.'}
          </p>
        </div>
        <div className="space-y-4 p-4 sm:space-y-5 sm:p-5">
          {createdAdmin ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="rounded-2xl border border-[#D7E3FF] bg-[#F2F6FF] p-3 sm:p-4">
                <p className="text-sm font-semibold">Compte créé avec succès</p>
                <p className="text-xs text-muted-foreground">
                  Identifiants prêts pour téléchargement ou envoi WhatsApp.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-[#DCE6FF] bg-white p-3 text-sm">
                    <p className="text-xs text-muted-foreground">Nom</p>
                    <p className="font-semibold">{createdAdmin.name}</p>
                  </div>
                  <div className="rounded-lg border border-[#DCE6FF] bg-white p-3 text-sm">
                    <p className="text-xs text-muted-foreground">Mot de passe</p>
                    <p className="font-semibold">{createdAdmin.password}</p>
                  </div>
                  <div className="rounded-lg border border-[#DCE6FF] bg-white p-3 text-sm">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-semibold">{createdAdmin.email || '—'}</p>
                  </div>
                  <div className="rounded-lg border border-[#DCE6FF] bg-white p-3 text-sm sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Lien d’accès</p>
                    <p className="font-semibold">{`${window.location.origin}/login`}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => onDownloadPdf(createdAdmin)} disabled={pdfLoading}>
                    {pdfLoading ? 'Génération...' : 'Télécharger PDF'}
                  </Button>
                  <Button onClick={() => onSendWhatsapp(createdAdmin)} disabled={!createdAdmin.phone}>
                    Envoyer WhatsApp
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                    setCreatedAdmin(null)
                  }}
                >
                  Fermer
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    onOpenChange(false)
                    setCreatedAdmin(null)
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    setCreatedAdmin(null)
                    onOpenChange(true)
                  }}
                >
                  Créer un autre
                </Button>
              </div>
            </div>
          ) : (
            <>
              <form
                className="space-y-4 sm:space-y-5"
                onSubmit={(event) => {
                  event.preventDefault()
                  onCreate()
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nom complet</label>
                    <Input
                      autoComplete="name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Nom et prénom"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email (optionnel)</label>
                    <Input
                      autoComplete="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Entreprise (optionnel)</label>
                    <Input
                      autoComplete="organization"
                      value={newEntreprise}
                      onChange={(e) => setNewEntreprise(e.target.value)}
                      placeholder="Nom de l’entreprise"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Téléphone WhatsApp</label>
                    <Input
                      autoComplete="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+221 77 123 45 67"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Mot de passe</label>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Laisser vide pour admin123"
                    />
                  </div>
                </div>
                {createError && <p className="text-sm text-destructive">{createError}</p>}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false)
                      setCreatedAdmin(null)
                    }}
                  >
                    Fermer
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Création...' : 'Créer le compte'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
