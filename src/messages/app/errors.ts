export const ERRORS = {
  GENERAL: 'app.errors.general',
  NETWORK: 'app.errors.network',
  PERMISSION: 'app.errors.permission',
  NOT_FOUND: 'app.errors.notFound',
  INVALID_DATA: 'app.errors.invalidData',
  SERVER_ERROR: 'app.errors.server',
  AUTH_FAILED: 'app.errors.authFailed',
  SESSION_EXPIRED: 'app.errors.sessionExpired',
} as const

export const ERRORS_FR: Record<string, string> = {
  [ERRORS.GENERAL]: 'Une erreur est survenue',
  [ERRORS.NETWORK]: 'Erreur de connexion',
  [ERRORS.PERMISSION]: "Vous n'avez pas les droits nécessaires",
  [ERRORS.NOT_FOUND]: 'Élément non trouvé',
  [ERRORS.INVALID_DATA]: 'Données invalides',
  [ERRORS.SERVER_ERROR]: 'Erreur serveur',
  [ERRORS.AUTH_FAILED]: "Échec de l'authentification",
  [ERRORS.SESSION_EXPIRED]: 'Session expirée, veuillez vous reconnecter',
}

export const ERRORS_EN: Record<string, string> = {
  [ERRORS.GENERAL]: 'An error occurred',
  [ERRORS.NETWORK]: 'Connection error',
  [ERRORS.PERMISSION]: 'You do not have the required permissions',
  [ERRORS.NOT_FOUND]: 'Item not found',
  [ERRORS.INVALID_DATA]: 'Invalid data',
  [ERRORS.SERVER_ERROR]: 'Server error',
  [ERRORS.AUTH_FAILED]: 'Authentication failed',
  [ERRORS.SESSION_EXPIRED]: 'Session expired, please log in again',
}
