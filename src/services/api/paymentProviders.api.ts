import type { AdminPaymentDTO } from '@/dto/frontend/responses'
import { apiFetch } from '../http'

export type PaymentProviderMode = 'manual' | 'api'

export type WaveProviderSettings = {
  apiBaseUrl: string
  initiationPath: string
  merchantId: string
  apiKey: string
  apiKeyConfigured: boolean
  apiKeyMasked: string
  apiSecret: string
  apiSecretConfigured: boolean
  apiSecretMasked: string
  webhookSecret: string
  webhookSecretConfigured: boolean
  webhookSecretMasked: string
}

export type OrangeMoneyProviderSettings = {
  apiBaseUrl: string
  initiationPath: string
  merchantCode: string
  clientId: string
  clientSecret: string
  clientSecretConfigured: boolean
  clientSecretMasked: string
  webhookSecret: string
  webhookSecretConfigured: boolean
  webhookSecretMasked: string
}

export type PaymentProviderSettings = {
  wave: WaveProviderSettings
  orangeMoney: OrangeMoneyProviderSettings
  webhooks: {
    wave: string
    orangeMoney: string
  }
}

export type PaymentProviderSettingsUpdate = {
  wave: Partial<WaveProviderSettings>
  orangeMoney: Partial<OrangeMoneyProviderSettings>
}

export async function getPaymentProviderSettings(): Promise<PaymentProviderSettings> {
  return apiFetch<PaymentProviderSettings>('/payment-providers/config')
}

export async function savePaymentProviderSettings(
  data: PaymentProviderSettingsUpdate
): Promise<PaymentProviderSettings> {
  return apiFetch<PaymentProviderSettings>('/payment-providers/config', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function validateAdminPayment(
  paymentId: string,
  note?: string
): Promise<AdminPaymentDTO> {
  return apiFetch<AdminPaymentDTO>(`/admin_payments/${encodeURIComponent(paymentId)}/validate`, {
    method: 'POST',
    body: JSON.stringify(note ? { note } : {}),
  })
}
