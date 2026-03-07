import { useRef } from 'react'
import { Building2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DEFAULT_LOGO_ASSET_PATH, resolveAssetUrl } from '@/services/assets'

type SettingsAdminBrandingSectionProps = {
  appName: string
  logoUrl: string
  onAppNameChange: (value: string) => void
  onSaveAppName: () => void
  onUseGlobalLogo: () => void
  onSelectLogo: (logoUrl: string) => void
  onUploadLogoFile: (file: File) => void
  isLoading: boolean
  isSaving: boolean
  isUploading: boolean
  isSavingName: boolean
  globalAppName: string
  globalLogoUrl: string
  adminScopeLabel: string
  logoLibrary: string[]
}

export function SettingsAdminBrandingSection({
  appName,
  logoUrl,
  onAppNameChange,
  onSaveAppName,
  onUseGlobalLogo,
  onSelectLogo,
  onUploadLogoFile,
  isLoading,
  isSaving,
  isUploading,
  isSavingName,
  globalAppName,
  globalLogoUrl,
  adminScopeLabel,
  logoLibrary,
}: SettingsAdminBrandingSectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewSource = resolveAssetUrl(logoUrl || globalLogoUrl || DEFAULT_LOGO_ASSET_PATH)
  const fallbackSource = resolveAssetUrl(globalLogoUrl || DEFAULT_LOGO_ASSET_PATH)

  return (
    <section className="mt-8 min-w-0 overflow-x-hidden sm:mt-10">
      <h3 className="font-medium">Identité de votre espace admin</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Le nom d’entreprise et le logo de <span className="font-semibold">{adminScopeLabel}</span> s’affichent dans
        les reçus/PDF et les écrans de cet admin.
      </p>

      <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-3">
          <div className="min-w-0 space-y-2 rounded-lg border bg-card p-3">
            <p className="text-xs font-medium text-muted-foreground">Nom d’entreprise</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Input
                value={appName}
                onChange={(event) => onAppNameChange(event.target.value)}
                placeholder={globalAppName}
                className="w-full min-w-0 flex-1 sm:min-w-[260px]"
                disabled={isLoading || isSavingName}
              />
              <Button onClick={onSaveAppName} disabled={isLoading || isSavingName} className="w-full sm:w-auto">
                {isSavingName ? 'Enregistrement...' : "Enregistrer le nom"}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Le logo doit être uploadé (Cloudinary). Le dernier upload devient automatiquement le logo actif.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isLoading || isSaving || isUploading}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                onUploadLogoFile(file)
                event.currentTarget.value = ''
              }}
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isSaving || isUploading}
              className="w-full sm:w-auto"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Upload...' : 'Uploader un logo'}
            </Button>
            <Button variant="outline" onClick={onUseGlobalLogo} disabled={isLoading || isSaving} className="w-full sm:w-auto">
              Utiliser le logo global
            </Button>
          </div>

          <div className="min-w-0 space-y-2 pt-1">
            <p className="text-xs text-muted-foreground">Logos enregistrés (choix rapide)</p>
            {logoLibrary.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {logoLibrary.map((logo) => {
                  const selected = logo === logoUrl
                  const logoSrc = resolveAssetUrl(logo)
                  return (
                    <button
                      key={logo}
                      type="button"
                      onClick={() => onSelectLogo(logo)}
                      className={`rounded-lg border p-1 bg-white transition ${selected ? 'border-primary ring-2 ring-primary/25' : 'border-border hover:border-primary/40'}`}
                      title="Utiliser ce logo"
                    >
                      <img
                        src={logoSrc}
                        alt="Logo enregistré"
                        className="h-10 w-full object-contain"
                        onError={(event) => {
                          event.currentTarget.src = fallbackSource
                        }}
                      />
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Aucun logo enregistré pour le moment.</p>
            )}
          </div>
        </div>

        <div className="flex w-full min-w-0 items-center gap-3 rounded-xl border bg-card px-4 py-3 xl:w-auto xl:min-w-[220px]">
          <div className="w-12 h-12 rounded-lg bg-sidebar-primary/10 flex items-center justify-center overflow-hidden">
            <img
              src={previewSource}
              alt="Aperçu logo admin"
              className="h-10 w-10 object-contain"
              onError={(event) => {
                event.currentTarget.src = fallbackSource
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Aperçu</p>
            <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1">
              <Building2 className="h-4 w-4 shrink-0" />
              {appName || globalAppName || adminScopeLabel}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
