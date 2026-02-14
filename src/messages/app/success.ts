export const SUCCESS = {
  SAVED: 'app.success.saved',
  CREATED: 'app.success.created',
  UPDATED: 'app.success.updated',
  DELETED: 'app.success.deleted',
  LOGIN_SUCCESS: 'app.success.login',
  IMPORT_SUCCESS: 'app.success.import',
} as const

export const SUCCESS_FR: Record<string, string> = {
  [SUCCESS.SAVED]: 'Enregistré avec succès',
  [SUCCESS.CREATED]: 'Créé avec succès',
  [SUCCESS.UPDATED]: 'Mis à jour avec succès',
  [SUCCESS.DELETED]: 'Supprimé avec succès',
  [SUCCESS.LOGIN_SUCCESS]: 'Connexion réussie',
  [SUCCESS.IMPORT_SUCCESS]: 'Importé avec succès',
}

export const SUCCESS_EN: Record<string, string> = {
  [SUCCESS.SAVED]: 'Saved successfully',
  [SUCCESS.CREATED]: 'Created successfully',
  [SUCCESS.UPDATED]: 'Updated successfully',
  [SUCCESS.DELETED]: 'Deleted successfully',
  [SUCCESS.LOGIN_SUCCESS]: 'Login successful',
  [SUCCESS.IMPORT_SUCCESS]: 'Imported successfully',
}
