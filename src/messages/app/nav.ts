export const NAV = {
  HOME: 'app.nav.home',
  DASHBOARD: 'app.nav.dashboard',
  CLIENTS: 'app.nav.clients',
  RENTALS: 'app.nav.rentals',
  PAYMENTS: 'app.nav.payments',
  DOCUMENTS: 'app.nav.documents',
  SETTINGS: 'app.nav.settings',
  LOGOUT: 'app.nav.logout',
} as const

export const NAV_FR: Record<string, string> = {
  [NAV.HOME]: 'Accueil',
  [NAV.DASHBOARD]: 'Tableau de bord',
  [NAV.CLIENTS]: 'Clients',
  [NAV.RENTALS]: 'Locations',
  [NAV.PAYMENTS]: 'Paiements',
  [NAV.DOCUMENTS]: 'Documents',
  [NAV.SETTINGS]: 'Paramètres',
  [NAV.LOGOUT]: 'Déconnexion',
}

export const NAV_EN: Record<string, string> = {
  [NAV.HOME]: 'Home',
  [NAV.DASHBOARD]: 'Dashboard',
  [NAV.CLIENTS]: 'Clients',
  [NAV.RENTALS]: 'Rentals',
  [NAV.PAYMENTS]: 'Payments',
  [NAV.DOCUMENTS]: 'Documents',
  [NAV.SETTINGS]: 'Settings',
  [NAV.LOGOUT]: 'Logout',
}
