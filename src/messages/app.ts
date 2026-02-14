/**
 * Messages globaux de l'application
 * Toutes les chaînes de caractères centralisées ici
 * Clés pour faciliter la traduction
 */

// Import depuis les sous-dossiers
import { ACTIONS, ACTIONS_EN, ACTIONS_FR } from './app/actions'
import { CONFIRMATIONS, CONFIRMATIONS_EN, CONFIRMATIONS_FR } from './app/confirmations'
import { ENTITIES, ENTITIES_EN, ENTITIES_FR } from './app/entities'
import { ERRORS, ERRORS_EN, ERRORS_FR } from './app/errors'
import { LABELS, LABELS_EN, LABELS_FR } from './app/labels'
import { MENU, MENU_EN, MENU_FR } from './app/menu'
import { NAV, NAV_EN, NAV_FR } from './app/nav'
import { PAGES, PAGES_EN, PAGES_FR } from './app/pages'
import { STATUS, STATUS_EN, STATUS_FR } from './app/status'
import { SUCCESS, SUCCESS_EN, SUCCESS_FR } from './app/success'
import { VALIDATION, VALIDATION_EN, VALIDATION_FR } from './app/validation'

export const MESSAGES = {
  VALIDATION,
  ACTIONS,
  ENTITIES,
  STATUS,
  PAGES,
  SUCCESS,
  ERRORS,
  CONFIRMATIONS,
  LABELS,
  NAV,
  MENU,
} as const

export const MESSAGES_FR: Record<string, string> = {
  ...VALIDATION_FR,
  ...ACTIONS_FR,
  ...ENTITIES_FR,
  ...STATUS_FR,
  ...PAGES_FR,
  ...SUCCESS_FR,
  ...ERRORS_FR,
  ...CONFIRMATIONS_FR,
  ...LABELS_FR,
  ...NAV_FR,
  ...MENU_FR,
}

export const MESSAGES_EN: Record<string, string> = {
  ...VALIDATION_EN,
  ...ACTIONS_EN,
  ...ENTITIES_EN,
  ...STATUS_EN,
  ...PAGES_EN,
  ...SUCCESS_EN,
  ...ERRORS_EN,
  ...CONFIRMATIONS_EN,
  ...LABELS_EN,
  ...NAV_EN,
  ...MENU_EN,
}

/**
 * Obtenir un message par clé
 */
export const t = (
  key: string,
  lang: 'fr' | 'en' = 'fr',
  params?: Record<string, string>
): string => {
  const messages = lang === 'fr' ? MESSAGES_FR : MESSAGES_EN
  let message = messages[key] || key

  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      message = message.replace(new RegExp(`{${param}}`, 'g'), value)
    })
  }

  return message
}

export const getAction = (key: keyof typeof MESSAGES.ACTIONS, lang: 'fr' | 'en' = 'fr'): string => {
  return t(MESSAGES.ACTIONS[key], lang)
}

export const getLabel = (key: keyof typeof MESSAGES.LABELS, lang: 'fr' | 'en' = 'fr'): string => {
  return t(MESSAGES.LABELS[key], lang)
}

export const getStatus = (key: keyof typeof MESSAGES.STATUS, lang: 'fr' | 'en' = 'fr'): string => {
  return t(MESSAGES.STATUS[key], lang)
}

export type MessageKey =
  (typeof MESSAGES)[keyof typeof MESSAGES][keyof (typeof MESSAGES)[keyof typeof MESSAGES]]
export type Messages = typeof MESSAGES_FR
