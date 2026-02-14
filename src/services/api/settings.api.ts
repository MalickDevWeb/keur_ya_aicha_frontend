import { apiFetch } from '../http'

/**
 * Interface pour un paramètre système
 */
export interface SettingRecord {
  id: string
  key: string
  value: string
}

/**
 * Récupère la valeur d'un paramètre système
 * @param key - Clé du paramètre
 * @returns Valeur du paramètre ou null
 */
export async function getSetting(key: string): Promise<string | null> {
  const data = await apiFetch<SettingRecord[]>(`/settings?key=${key}`)
  if (data.length === 0) return null
  return data[0].value
}

/**
 * Définit ou met à jour un paramètre système
 * @param key - Clé du paramètre
 * @param value - Nouvelle valeur
 */
export async function setSetting(key: string, value: string): Promise<void> {
  const data = await apiFetch<SettingRecord[]>(`/settings?key=${key}`)
  if (data.length === 0) {
    await apiFetch<void>('/settings', {
      method: 'POST',
      body: JSON.stringify({ id: key, key, value }),
    })
  } else {
    const settingId = data[0].id
    await apiFetch<void>(`/settings/${settingId}`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    })
  }
}
