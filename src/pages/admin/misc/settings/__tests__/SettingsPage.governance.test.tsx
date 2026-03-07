import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import SettingsPage from '../SettingsPage'
import { DEFAULT_PLATFORM_CONFIG, type PlatformConfig } from '@/services/platformConfig'

const {
  getSettingMock,
  setSettingMock,
  changeOwnPasswordMock,
  toastMock,
  logActionMock,
  refreshPlatformConfigFromServerMock,
  savePlatformConfigMock,
  sendComplianceWebhookAlertMock,
} = vi.hoisted(() => ({
  getSettingMock: vi.fn(),
  setSettingMock: vi.fn(),
  changeOwnPasswordMock: vi.fn(async () => undefined),
  toastMock: vi.fn(),
  logActionMock: vi.fn().mockResolvedValue(undefined),
  refreshPlatformConfigFromServerMock: vi.fn(),
  savePlatformConfigMock: vi.fn(),
  sendComplianceWebhookAlertMock: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'super-admin-id',
      role: 'SUPER_ADMIN',
      name: 'Super Admin',
      username: 'super-admin',
    },
    impersonation: null,
  }),
}))

vi.mock('@/hooks/useElectronAPI', () => ({
  useElectronAPI: () => ({
    isElectron: false,
    openRuntimeConfigFolder: undefined,
  }),
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}))

vi.mock('@/lib/actionLogger', () => ({
  useActionLogger: () => logActionMock,
}))

vi.mock('@/services/api', () => ({
  getSetting: getSettingMock,
  setSetting: setSettingMock,
  changeOwnPassword: changeOwnPasswordMock,
}))

vi.mock('@/services/api/uploads.api', () => ({
  uploadToCloudinary: vi.fn(async () => 'https://cdn.example.test/logo.png'),
}))

vi.mock('@/services/api/auditLogs.api', () => ({
  listAuditLogs: vi.fn(async () => []),
  deleteAuditLogs: vi.fn(async () => undefined),
}))

vi.mock('@/services/runtimeConfig', () => ({
  ensureRuntimeConfigLoaded: vi.fn(async () => undefined),
  getRuntimeConfigSnapshot: vi.fn(() => ({
    apiBaseUrl: 'http://localhost:3000/api',
    cloudinarySignUrl: 'http://localhost:3000/api/sign',
    source: 'browser',
    userPath: null,
    portablePath: null,
    writtenPath: null,
  })),
  updateRuntimeConfig: vi.fn(async () => ({
    apiBaseUrl: 'http://localhost:3000/api',
    cloudinarySignUrl: 'http://localhost:3000/api/sign',
    source: 'browser',
    userPath: null,
    portablePath: null,
    writtenPath: null,
  })),
  validateRuntimeApiBaseUrl: vi.fn((value: string) => value),
  validateRuntimeSignUrl: vi.fn((value: string) => value),
}))

vi.mock('@/services/adminBranding', () => ({
  fetchAdminBrandingOverrides: vi.fn(async () => ({ appName: '', logoUrl: '' })),
  fetchAdminLogoLibrary: vi.fn(async () => []),
  saveAdminAppNameOverride: vi.fn(async () => undefined),
  saveAdminLogoOverride: vi.fn(async () => undefined),
  appendAdminLogoToLibrary: vi.fn(async () => []),
}))

vi.mock('@/services/platformConfig', async () => {
  const actual = await vi.importActual<typeof import('@/services/platformConfig')>(
    '@/services/platformConfig'
  )
  return {
    ...actual,
    getPlatformConfigSnapshot: vi.fn(
      () => JSON.parse(JSON.stringify(actual.DEFAULT_PLATFORM_CONFIG)) as PlatformConfig
    ),
    refreshPlatformConfigFromServer: refreshPlatformConfigFromServerMock,
    savePlatformConfig: savePlatformConfigMock,
    sendComplianceWebhookAlert: sendComplianceWebhookAlertMock,
    applyBrandingToDocument: vi.fn(),
  }
})

describe('SettingsPage governance UI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSettingMock.mockResolvedValue(null)
    setSettingMock.mockResolvedValue(undefined)
    changeOwnPasswordMock.mockResolvedValue(undefined)
    refreshPlatformConfigFromServerMock.mockResolvedValue(
      JSON.parse(JSON.stringify(DEFAULT_PLATFORM_CONFIG)) as PlatformConfig
    )
    savePlatformConfigMock.mockImplementation(
      async (payload: PlatformConfig) =>
        JSON.parse(JSON.stringify(payload)) as PlatformConfig
    )
  })

  it('active maintenance and saves governance config', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    )

    const governanceTitle = await screen.findByText('Gouvernance Plateforme (Super Admin)')
    const governanceSection = governanceTitle.closest('section')
    expect(governanceSection).not.toBeNull()

    const maintenanceHeading = await screen.findByText('Mode Maintenance Global')
    const maintenanceCard = maintenanceHeading.closest('div')
    expect(maintenanceCard).not.toBeNull()

    const maintenanceSwitch = within(maintenanceCard as HTMLElement).getByRole('switch')
    expect(maintenanceSwitch).toHaveAttribute('aria-checked', 'false')

    await user.click(maintenanceSwitch)
    expect(maintenanceSwitch).toHaveAttribute('aria-checked', 'true')

    const maintenanceMessageInput = within(maintenanceCard as HTMLElement).getByPlaceholderText(
      'Message maintenance affiché à tous'
    )
    await user.clear(maintenanceMessageInput)
    await user.type(maintenanceMessageInput, 'Maintenance active depuis test UI')

    const saveButton = within(governanceSection as HTMLElement).getByRole('button', {
      name: 'Enregistrer',
    })
    await waitFor(() => expect(saveButton).not.toBeDisabled())
    await user.click(saveButton)

    await waitFor(() => expect(savePlatformConfigMock).toHaveBeenCalledTimes(1))

    const savedConfig = savePlatformConfigMock.mock.calls[0][0] as PlatformConfig
    expect(savedConfig.maintenance.enabled).toBe(true)
    expect(savedConfig.maintenance.message).toBe('Maintenance active depuis test UI')
    expect(sendComplianceWebhookAlertMock).toHaveBeenCalledTimes(1)
  })

  it('changes password from settings without exposing login page flow', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    )

    await user.type(await screen.findByLabelText('Mot de passe actuel'), 'ancienMotDePasse')
    await user.type(screen.getByLabelText('Nouveau mot de passe'), 'nouveauMotDePasse')
    await user.type(screen.getByLabelText('Confirmer le nouveau mot de passe'), 'nouveauMotDePasse')

    await user.click(
      screen.getByRole('button', {
        name: 'Mettre à jour le mot de passe',
      })
    )

    await waitFor(() =>
      expect(changeOwnPasswordMock).toHaveBeenCalledWith('ancienMotDePasse', 'nouveauMotDePasse')
    )
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Mot de passe mis à jour',
      })
    )
  })
})
