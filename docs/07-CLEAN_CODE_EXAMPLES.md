# Recommandations Clean Code - Code Examples 💡

## 1. Réduire SuperAdminDashboard (653 → 150 lignes)

### ❌ AVANT

```typescript
export function SuperAdminDashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  // ... 20+ other states
  const [admins, setAdmins] = useState<AdminDTO[]>([])
  const [requests, setRequests] = useState<AdminRequestDTO[]>([])

  useEffect(() => {
    // Logique d'initialisation complexe
    const refresh = async () => { /* ... */ }
    refresh()
  }, [])

  const pendingRequests = useMemo(() => {
    const needle = pendingSearch.trim().toLowerCase()
    let list = requests.filter((r) => {
      if (r.status !== 'EN_ATTENTE') return false
      if (!needle) return true
      const name = String(r.name || '').toLowerCase()
      const username = String(r.username || '').toLowerCase()
      // ... 10 lines more
    })
    if (pendingOnlyEntreprise) {
      list = list.filter((r) => String(r.entrepriseName || '').trim().length > 0)
    }
    return list
  }, [requests, pendingSearch, pendingOnlyEntreprise])

  return (
    <div>
      <CreateAdminDialog {...props} />
      <PendingRequestsSection requests={visiblePending} />
      <AuditLogsSection logs={visibleLogs} />
      {/* ... 50+ lignes de JSX */}
    </div>
  )
}
```

### ✅ APRÈS

**1. Créer un hook pour la gestion d'état**

```typescript
// src/hooks/useAdminDashboard.ts
interface DashboardState {
  admins: AdminDTO[]
  requests: AdminRequestDTO[]
  entreprises: EntrepriseDTO[]
  users: UserDTO[]
  auditLogs: AuditLogDTO[]
  loading: boolean
  error: string | null
}

export function useAdminDashboard() {
  const [state, setState] = useState<DashboardState>({
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

**2. Créer un hook pour les filtres**

```typescript
// src/hooks/useSearch.ts
export function useSearch<T>(data: T[], searchFn: (item: T, query: string) => boolean) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query) return data
    return data.filter((item) => searchFn(item, query.toLowerCase().trim()))
  }, [data, query])

  return { query, setQuery, filtered }
}

// Utilisation
const {
  query: pendingSearch,
  setQuery: setPendingSearch,
  filtered: pendingRequests,
} = useSearch(requests, (r, q) => {
  if (r.status !== 'EN_ATTENTE') return false
  return [r.name, r.username, r.email, r.phone, r.entrepriseName]
    .join(' ')
    .toLowerCase()
    .includes(q)
})
```

**3. Décomposer en sous-composants**

```typescript
// src/pages/super-admin/SuperAdminDashboard.tsx (150 lignes seulement!)
export function SuperAdminDashboard() {
  const { admins, requests, entreprises, users, auditLogs, loading, refresh } =
    useAdminDashboard()

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader title="Super Admin Dashboard" action={<RefreshButton onClick={refresh} />} />

      <CreateAdminSection admins={admins} entreprises={entreprises} onSuccess={refresh} />
      <GlobalStatsSection data={{ admins, requests, users, auditLogs }} />
      <PendingRequestsPanel requests={requests} onUpdate={refresh} />
      <AdminsListSection admins={admins} entreprises={entreprises} onUpdate={refresh} />
      <AuditLogsPanel logs={auditLogs} />
    </div>
  )
}
```

---

## 2. Extraire la Logique de Filtre (Réduire de 30% la duplication)

### ❌ AVANT

```typescript
// SuperAdminDashboard
const filteredAdmins = useMemo(() => {
  const needle = adminSearch.trim().toLowerCase()
  if (!needle) return admins
  return admins.filter((a) => {
    const name = String(a.name || '').toLowerCase()
    const username = String(a.username || '').toLowerCase()
    const email = String(a.email || '').toLowerCase()
    const entreprise = entreprises.find((e) => e.id === a.entrepriseId)
    const entrepriseName = String(entreprise?.name || '').toLowerCase()
    return (
      name.includes(needle) ||
      username.includes(needle) ||
      email.includes(needle) ||
      entrepriseName.includes(needle)
    )
  })
}, [admins, adminSearch, entreprises])

// PaymentsPage (même logique)
const filtered = useMemo(() => {
  const needle = paymentSearch.trim().toLowerCase()
  if (!needle) return payments
  return payments.filter((p) => {
    // ... same search logic
  })
}, [payments, paymentSearch])

// ClientsPage (encore la même)
// DangerClientsPage (toujours pareille)
```

### ✅ APRÈS

**Créer un util réutilisable**

```typescript
// src/lib/search.ts
export interface Searchable {
  [key: string]: string | undefined
}

/**
 * Crée une fonction de recherche qui cherche dans plusieurs champs
 */
export function createSearchFn<T extends Searchable>(
  fields: (keyof T)[]
): (item: T, query: string) => boolean {
  return (item, query) => {
    const needle = query.trim().toLowerCase()
    if (!needle) return true

    return fields.some((field) => {
      const value = String(item[field] || '').toLowerCase()
      return value.includes(needle)
    })
  }
}

/**
 * Hook pour recherche réutilisable
 */
export function useSearch<T extends Searchable>(data: T[], fields: (keyof T)[], initialQuery = '') {
  const [query, setQuery] = useState(initialQuery)
  const searchFn = useMemo(() => createSearchFn(fields), [fields])

  const filtered = useMemo(() => {
    return data.filter((item) => searchFn(item, query))
  }, [data, query, searchFn])

  return { query, setQuery, filtered }
}
```

**Utilisation simplifiée**

```typescript
// SuperAdminDashboard
const {
  query: adminSearch,
  setQuery: setAdminSearch,
  filtered: filteredAdmins,
} = useSearch(admins, ['name', 'username', 'email', 'entrepriseId'] as const)

// PaymentsPage
const {
  query: paymentSearch,
  setQuery: setPaymentSearch,
  filtered: filteredPayments,
} = useSearch(payments, ['clientName', 'amount', 'status'] as const)

// ClientsPage
const {
  query: clientSearch,
  setQuery: setClientSearch,
  filtered: filteredClients,
} = useSearch(clients, ['name', 'phone', 'email'] as const)
```

---

## 3. Éliminer les useMemo Inutiles

### ❌ AVANT

```typescript
const paymentDistribution = useMemo(() => {
  return [
    { name: 'Payées', value: paymentStats.paid },
    { name: 'Non payées', value: paymentStats.unpaid },
    { name: 'Partielles', value: paymentStats.partial },
  ]
}, [paymentStats])

// ↑ useMemo sur un simple tableau = INUTILE!
```

### ✅ APRÈS

```typescript
// Juste une constante
const paymentDistribution = [
  { name: 'Payées', value: paymentStats.paid },
  { name: 'Non payées', value: paymentStats.unpaid },
  { name: 'Partielles', value: paymentStats.partial },
]

// Ou, si vraiment besoin de calcul:
const paymentDistribution = useMemo(() => {
  return calculateExpensivePaymentStats(paymentStats) // CPU intensive
}, [paymentStats])
```

**Règle**: Utiliser useMemo seulement si:

- ✅ Calcul complexe/lourd (>100ms)
- ✅ Dépendance d'objets volumineux
- ❌ Pas pour de simples transformations
- ❌ Pas pour des constantes

---

## 4. Créer des Composants Réutilisables

### ❌ AVANT

```typescript
// ImportClientsPage
const [isImporting, setIsImporting] = useState(false)
const [showFix, setShowFix] = useState(false)

// ImportSuccess
const [isLoading, setIsLoading] = useState(true)

// ImportErrors
const [isLoading, setIsLoading] = useState(true)
const [showOnlyErrors, setShowOnlyErrors] = useState(false)

// Même logique partout!
```

### ✅ APRÈS

**Créer un composant réutilisable**

```typescript
// src/components/ImportManager.tsx
interface ImportManagerProps {
  onImport: (file: File) => Promise<ImportResult>
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function ImportManager({ onImport, onSuccess, onError }: ImportManagerProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleImport = async (file: File) => {
    setIsImporting(true)
    setError(null)
    try {
      const result = await onImport(file)
      setResult(result)
      onSuccess?.()
    } catch (err) {
      const error = err as Error
      setError(error.message)
      onError?.(error)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <FileInput onFile={handleImport} disabled={isImporting} />
      {error && <ErrorAlert message={error} />}
      {result && <SuccessAlert result={result} />}
      {isImporting && <LoadingSpinner />}
    </div>
  )
}
```

---

## 5. Normaliser les Formatters

### ❌ AVANT

```typescript
// Partout dans les composants
const formatted = date.toLocaleDateString('fr-FR')
phone.replace(/[^\d]/g, '')
amount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })
```

### ✅ APRÈS

**Centraliser les formatters**

```typescript
// src/lib/formatters.ts
export const Formatters = {
  date: (date: string | Date): string => {
    return new Date(date).toLocaleDateString('fr-FR')
  },

  phone: (phone: string): string => {
    const digits = phone.replace(/[^\d]/g, '')
    return digits.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')
  },

  currency: (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
    }).format(amount)
  },

  percentage: (value: number): string => {
    return `${(value * 100).toFixed(1)}%`
  },
}

// Utilisation
<span>{Formatters.date(createdAt)}</span>
<span>{Formatters.phone(phoneNumber)}</span>
<span>{Formatters.currency(amount)}</span>
```

---

## 6. Migrations d'État Complexe

### ❌ AVANT

```typescript
// SuperAdminDashboard: Gérer 20 états séparés
const [admins, setAdmins] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')
const [filters, setFilters] = useState({})
const [search, setSearch] = useState('')
// ... 16 autres states
```

### ✅ APRÈS - Option 1: useReducer

```typescript
interface State {
  admins: AdminDTO[]
  loading: boolean
  error: string | null
  filters: FilterState
  search: string
}

type Action =
  | { type: 'SET_ADMINS'; payload: AdminDTO[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_FILTER'; payload: Partial<FilterState> }
  | { type: 'SET_SEARCH'; payload: string }

const initialState: State = {
  admins: [],
  loading: true,
  error: null,
  filters: {},
  search: '',
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ADMINS':
      return { ...state, admins: action.payload, loading: false }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'UPDATE_FILTER':
      return { ...state, filters: { ...state.filters, ...action.payload } }
    case 'SET_SEARCH':
      return { ...state, search: action.payload }
    default:
      return state
  }
}

// Dans le composant
const [state, dispatch] = useReducer(reducer, initialState)
```

### ✅ APRÈS - Option 2: Zustand

```typescript
// src/store/adminDashboard.store.ts
import { create } from 'zustand'

interface AdminDashboardState {
  admins: AdminDTO[]
  loading: boolean
  error: string | null
  filters: FilterState
  search: string

  // Actions
  setAdmins: (admins: AdminDTO[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateFilter: (filter: Partial<FilterState>) => void
  setSearch: (search: string) => void
  refresh: () => Promise<void>
}

export const useAdminDashboardStore = create<AdminDashboardState>((set) => ({
  admins: [],
  loading: true,
  error: null,
  filters: {},
  search: '',

  setAdmins: (admins) => set({ admins }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  updateFilter: (filter) => set((state) => ({
    filters: { ...state.filters, ...filter }
  })),
  setSearch: (search) => set({ search }),

  refresh: async () => {
    set({ loading: true })
    try {
      const admins = await listAdmins()
      set({ admins, loading: false, error: null })
    } catch (error) {
      set({ error: String(error), loading: false })
    }
  },
}))

// Dans le composant (5 lignes au lieu de 20 états!)
function SuperAdminDashboard() {
  const { admins, search, setSearch, refresh } = useAdminDashboardStore()

  useEffect(() => { refresh() }, [refresh])

  return (
    <div>
      <SearchInput value={search} onChange={setSearch} />
      {/* ... */}
    </div>
  )
}
```

---

## Résumé des Améliorations

| Problème             | Solution                      | Impact              |
| -------------------- | ----------------------------- | ------------------- |
| Composant 653 lignes | Extraire en sous-composants   | -70% de complexité  |
| 20+ useState         | useReducer ou Zustand         | -80% de code        |
| Logique dupliquée    | Créer des hooks réutilisables | -30% duplication    |
| useMemo excessif     | Supprimer si pas CPU intense  | +10% performance    |
| Formatters en dur    | Centraliser dans `lib/`       | +20% maintenabilité |

**Effort Estimé**:

- SuperAdminDashboard: 5-8h
- Extraction hooks/utils: 3-5h
- Migration état: 2-3h
- **Total: 10-16h** pour passer à **9/10**
