export const PAGES = {
  DASHBOARD: 'app.pages.dashboard',
  CLIENTS: 'app.pages.clients',
  ADD_CLIENT: 'app.pages.addClient',
  EDIT_CLIENT: 'app.pages.editClient',
  RENTALS: 'app.pages.rentals',
  ADD_RENTAL: 'app.pages.addRental',
  PAYMENTS: 'app.pages.payments',
  SETTINGS: 'app.pages.settings',
  LOGIN: 'app.pages.login',
  ADMIN_SIGNUP: 'app.pages.adminSignup',
  SUPER_ADMIN: 'app.pages.superAdmin',
} as const

export const PAGES_FR: Record<string, string> = {
  [PAGES.DASHBOARD]: 'Tableau de bord',
  [PAGES.CLIENTS]: 'Gestion des clients',
  [PAGES.ADD_CLIENT]: 'Ajouter un client',
  [PAGES.EDIT_CLIENT]: 'Modifier le client',
  [PAGES.RENTALS]: 'Gestion des locations',
  [PAGES.ADD_RENTAL]: 'Ajouter une location',
  [PAGES.PAYMENTS]: 'Gestion des paiements',
  [PAGES.SETTINGS]: 'Paramètres',
  [PAGES.LOGIN]: 'Connexion',
  [PAGES.ADMIN_SIGNUP]: 'Inscription administrateur',
  [PAGES.SUPER_ADMIN]: 'Administration',
}

export const PAGES_EN: Record<string, string> = {
  [PAGES.DASHBOARD]: 'Dashboard',
  [PAGES.CLIENTS]: 'Client Management',
  [PAGES.ADD_CLIENT]: 'Add Client',
  [PAGES.EDIT_CLIENT]: 'Edit Client',
  [PAGES.RENTALS]: 'Rental Management',
  [PAGES.ADD_RENTAL]: 'Add Rental',
  [PAGES.PAYMENTS]: 'Payment Management',
  [PAGES.SETTINGS]: 'Settings',
  [PAGES.LOGIN]: 'Login',
  [PAGES.ADMIN_SIGNUP]: 'Administrator Signup',
  [PAGES.SUPER_ADMIN]: 'Administration',
}
