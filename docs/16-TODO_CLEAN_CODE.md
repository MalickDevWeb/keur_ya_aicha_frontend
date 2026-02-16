# Plan d'Action Clean Code - À Faire 📋

## 🎯 Objectif: Passer de 7.5/10 à 9/10+

---

## 📌 PRIORITÉ 1: Services API (FAIT ✅)

- ✅ Refactoriser avec Factory Pattern
- ✅ Ajouter Logger centralisé
- ✅ Typage strict 100%
- ✅ JSDoc complet
- ✅ Gestion d'erreur robuste

**Temps**: ~~8-10h~~ ✅ COMPLÉTÉ

---

## 📌 PRIORITÉ 2: Hooks & Utils (À FAIRE)

### Étape 1: Créer les Hooks Manquants

**Fichier: `src/hooks/useSearch.ts`** (30 min)

```typescript
/**
 * Hook pour recherche flexible sur n'importe quel objet
 * Réduit 30% de duplication de code
 */
export function useSearch<T>(data: T[], searchFn: (item: T, query: string) => boolean) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return data
    return data.filter((item) => searchFn(item, query.toLowerCase().trim()))
  }, [data, query, searchFn])

  return { query, setQuery, filtered }
}
```

**Checklist:**

- [ ] Créer `src/hooks/useSearch.ts`
- [ ] Tester avec SuperAdminDashboard
- [ ] Tester avec ClientsPage
- [ ] Tester avec PaymentsPage
- [ ] Documenter avec JSDoc

**Fichier: `src/hooks/usePagination.ts`** (30 min)

```typescript
export function usePagination<T>(data: T[], pageSize = 10) {
  const [page, setPage] = useState(1)

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return data.slice(start, end)
  }, [data, page, pageSize])

  const totalPages = Math.ceil(data.length / pageSize)

  return {
    data: paginatedData,
    page,
    setPage,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}
```

**Checklist:**

- [ ] Créer `src/hooks/usePagination.ts`
- [ ] Implémenter dans AdminsList
- [ ] Implémenter dans AuditLogs

**Fichier: `src/hooks/useAsync.ts`** (1h)

```typescript
interface UseAsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export function useAsync<T>(asyncFunction: () => Promise<T>, immediate = true) {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  })

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null })
    try {
      const response = await asyncFunction()
      setState({ data: response, loading: false, error: null })
      return response
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error })
      throw error
    }
  }, [asyncFunction])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return { ...state, execute }
}
```

**Checklist:**

- [ ] Créer `src/hooks/useAsync.ts`
- [ ] Remplacer useEffect + useState dans ImportClientsPage
- [ ] Remplacer dans ImportErrors
- [ ] Remplacer dans ImportSuccess

**Total Étape 1: 2h**

---

### Étape 2: Extraire les Formatters

**Fichier: `src/lib/formatters.ts`** (1h)

```typescript
export const Formatters = {
  // Dates
  date: (date: string | Date, format = 'short'): string => {
    const d = new Date(date)
    if (format === 'short') return d.toLocaleDateString('fr-FR')
    return d.toLocaleString('fr-FR')
  },

  // Phone
  phone: (phone: string): string => {
    const digits = phone.replace(/[^\d]/g, '')
    const length = digits.length

    if (length === 9) return digits.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')
    if (length === 11) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '+$1 $2 $3 $4')
    return digits
  },

  // Currency
  currency: (amount: number, currency = 'XOF'): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(amount)
  },

  // Percentage
  percentage: (value: number, decimals = 1): string => {
    return `${(value * 100).toFixed(decimals)}%`
  },

  // Status
  status: (status: string): string => {
    const statusMap: Record<string, string> = {
      EN_ATTENTE: 'En attente',
      ACTIF: 'Actif',
      INACTIF: 'Inactif',
      ARCHIVE: 'Archivé',
    }
    return statusMap[status] || status
  },
}
```

**Checklist:**

- [ ] Créer `src/lib/formatters.ts`
- [ ] Utiliser dans SuperAdminDashboard
- [ ] Utiliser dans ClientsPage
- [ ] Utiliser dans PaymentsPage
- [ ] Ajouter tests unitaires

**Total Étape 2: 1h**

---

## 📌 PRIORITÉ 3: Refactorisation SuperAdminDashboard (3-4h)

### Étape 1: Décomposer en Sous-Composants

**Créer ces fichiers:**

**`src/pages/super-admin/sections/CreateAdminForm.tsx`**

- [ ] Extraire la logique CreateAdminDialog
- [ ] 100 lignes max
- [ ] Propres types

**`src/pages/super-admin/sections/AdminsListSection.tsx`**

- [ ] Liste des admins avec filtres
- [ ] Utiliser `useSearch` hook
- [ ] Pagination

**`src/pages/super-admin/sections/PendingRequestsPanel.tsx`**

- [ ] Demandes en attente
- [ ] Utiliser `useSearch` hook

**`src/pages/super-admin/sections/AuditLogsPanel.tsx`**

- [ ] Logs d'audit
- [ ] Utiliser `usePagination`

**`src/pages/super-admin/sections/GlobalStatsSection.tsx`**

- [ ] Statistiques globales
- [ ] Charts et KPIs

**Checklist:**

- [ ] Créer 5 sous-composants
- [ ] Chacun <200 lignes
- [ ] Utiliser les hooks `useSearch`, `usePagination`
- [ ] Ajouter JSDoc
- [ ] SuperAdminDashboard réduit à <150 lignes

**Total: 3h**

---

### Étape 2: Créer des Hooks Spécialisés

**`src/hooks/useAdminDashboard.ts`** (1h)

- [ ] Centralize data fetching
- [ ] Centralize state management
- [ ] Error handling
- [ ] Loading states

```typescript
export function useAdminDashboard() {
  const [state, setState] = useState({
    admins: [],
    requests: [],
    entreprises: [],
    users: [],
    auditLogs: [],
    loading: true,
    error: null,
  })

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }))
    try {
      const [admins, requests, entreprises, users, auditLogs] = await Promise.all([
        listAdmins(),
        listAdminRequests(),
        listEntreprises(),
        listUsers(),
        listAuditLogs(),
      ])
      setState({
        admins,
        requests,
        entreprises,
        users,
        auditLogs,
        loading: false,
        error: null,
      })
    } catch (error) {
      setState((s) => ({
        ...s,
        loading: false,
        error: String(error),
      }))
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { ...state, refresh }
}
```

**Checklist:**

- [ ] Créer le hook
- [ ] Tester les erreurs
- [ ] Tester les rechargements

**Total: 1h**

---

## 📌 PRIORITÉ 4: Pages Volumineuses (4-5h)

### ImportClientsPage (2h)

- [ ] Réduire de 500+ à <200 lignes
- [ ] Extraire `ImportForm`, `ImportPreview`
- [ ] Utiliser `useAsync` hook

### ImportErrors (2h)

- [ ] Réduire de 500+ à <250 lignes
- [ ] Extraire `ErrorList`, `ErrorStats`
- [ ] Utiliser `usePagination`

### DangerClients (1h)

- [ ] Utiliser `useSearch`
- [ ] Mieux structurer

**Checklist:**

- [ ] Réduire ImportClientsPage
- [ ] Réduire ImportErrors
- [ ] Optimiser DangerClients

**Total: 5h**

---

## 📌 PRIORITÉ 5: État Global (2-3h)

### Option A: useReducer (2h)

```typescript
// src/hooks/useAdminDashboardState.ts
const [state, dispatch] = useReducer(reducer, initialState)
```

### Option B: Zustand (2h)

```typescript
// src/store/adminDashboard.store.ts
export const useAdminDashboardStore = create(...)
```

**Checklist:**

- [ ] Choisir useReducer ou Zustand
- [ ] Implémenter pour SuperAdminDashboard
- [ ] Implémenter pour Pages principales
- [ ] Tester les mutations

**Recommandation**: Utiliser **Zustand** (plus simple et performant)

**Total: 2-3h**

---

## 📊 Résumé des Tâches

| Tâche                     | Effort     | Statut      |
| ------------------------- | ---------- | ----------- |
| 1. Hooks réutilisables    | 2h         | À faire     |
| 2. Formatters centralisés | 1h         | À faire     |
| 3. SuperAdminDashboard    | 4h         | À faire     |
| 4. Pages volumineuses     | 5h         | À faire     |
| 5. État global            | 2-3h       | À faire     |
| **Total**                 | **14-16h** | **À faire** |

---

## 📈 Progression Estimée

- **Semaine 1**: Tâches 1 & 2 (3h) → **8.0/10**
- **Semaine 2**: Tâche 3 (4h) → **8.5/10**
- **Semaine 3**: Tâche 4 (5h) → **9.0/10**
- **Semaine 4**: Tâche 5 (2-3h) + Tests → **9.5/10**

---

## ✅ Checklist Finale

### Services API

- ✅ Factory Pattern CRUD
- ✅ Logger centralisé
- ✅ Typage strict
- ✅ JSDoc complet
- ✅ Gestion d'erreur
- **Score: 10/10** ✅

### Hooks & Utils

- [ ] useSearch
- [ ] usePagination
- [ ] useAsync
- [ ] Formatters centralisés
- **Score: 7→9/10** (à faire)

### Composants

- [ ] SuperAdminDashboard <150 lignes
- [ ] Sous-composants <200 lignes
- [ ] ImportClientsPage <200 lignes
- [ ] ImportErrors <250 lignes
- **Score: 6→8.5/10** (à faire)

### État

- [ ] Consolidation des états
- [ ] useReducer ou Zustand
- **Score: 7→8.5/10** (à faire)

### Documentation

- ✅ CLEAN_CODE_ANALYSIS.md
- ✅ CLEAN_CODE_EXAMPLES.md
- [ ] README pour pages complexes
- [ ] JSDoc sur tous les composants
- **Score: 8→9/10** (partiellement fait)

---

## 🚀 Commencer Maintenant

**Première tâche (30 min)**:

```bash
# Créer src/hooks/useSearch.ts
# Utiliser dans SuperAdminDashboard
# Voir CLEAN_CODE_EXAMPLES.md pour le code
```

**Puis (1h)**:

```bash
# Créer src/lib/formatters.ts
# Remplacer formatters en dur dans les composants
```

**Objectif cette semaine: +1 point**

- Commencer par hooks (facile wins)
- Puis formatters (bon impact)
- 3h de travail = 8.0/10 ✨
