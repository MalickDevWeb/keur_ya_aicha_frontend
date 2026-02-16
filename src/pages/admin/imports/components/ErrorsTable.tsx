import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useIsMobile } from '@/hooks/use-mobile'
import { usePagination } from '@/hooks/usePagination'
import { useSearch } from '@/hooks/useSearch'
import type { StoredErrors } from '@/services/importErrors'

interface ErrorsTableProps {
  storedErrors: StoredErrors['errors']
  inserted?: StoredErrors['inserted']
  editable?: boolean
  onUpdate?: (index: number, field: 'firstName' | 'lastName' | 'phone' | 'email' | 'cni', value: string) => void
}

type PaginatedErrorWithIndex = {
  error: StoredErrors['errors'][number]
  sourceIndex: number
  key: string
}

/**
 * Component for displaying import errors in table format
 * Extracted from ImportErrors.tsx for reusability
 */
export function ErrorsTable({ storedErrors, inserted, editable = false, onUpdate }: ErrorsTableProps) {
  const isMobile = useIsMobile()

  const { query, setQuery, filtered } = useSearch(storedErrors, (error, q) => {
    const fname = error.parsed.firstName?.toLowerCase() || ''
    const lname = error.parsed.lastName?.toLowerCase() || ''
    const phone = error.parsed.phone?.toLowerCase() || ''
    const email = error.parsed.email?.toLowerCase() || ''
    return fname.includes(q) || lname.includes(q) || phone.includes(q) || email.includes(q)
  })

  const { data: paginatedErrors, page, setPage, totalPages, hasNext, hasPrev } = usePagination(filtered, 20)

  const paginatedErrorsWithIndex = useMemo<PaginatedErrorWithIndex[]>(
    () =>
      paginatedErrors.map((error, idx) => {
        const refIndex = storedErrors.findIndex((candidate) => candidate === error)
        if (refIndex >= 0) {
          return { error, sourceIndex: refIndex, key: `${error.rowNumber}-${refIndex}` }
        }

        const fallbackIndex = storedErrors.findIndex(
          (candidate) =>
            candidate.rowNumber === error.rowNumber &&
            String(candidate.parsed.phone || '') === String(error.parsed.phone || '') &&
            String(candidate.parsed.email || '') === String(error.parsed.email || '')
        )

        const sourceIndex = fallbackIndex >= 0 ? fallbackIndex : idx
        return { error, sourceIndex, key: `${error.rowNumber}-${sourceIndex}-${idx}` }
      }),
    [paginatedErrors, storedErrors]
  )

  const successCount = (inserted?.length || 0) + storedErrors.filter((e) => !e.errors.length).length
  const errorCount = storedErrors.filter((e) => e.errors.length > 0).length

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          placeholder="Rechercher par nom, téléphone..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
          className="w-full sm:max-w-sm"
        />
        <div className="text-sm text-gray-600 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
            {successCount} importés ✓
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-red-700">
            {errorCount} erreurs ✗
          </span>
        </div>
      </div>

      {paginatedErrorsWithIndex.length > 0 ? (
        <>
          {isMobile ? (
            <div className="space-y-3">
              {paginatedErrorsWithIndex.map(({ error, sourceIndex, key }) => (
                <div
                  key={key}
                  className={`rounded-lg border p-3 ${
                    error.errors.length > 0 ? 'border-red-100 bg-red-50' : 'border-emerald-100 bg-emerald-50'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Ligne {error.rowNumber}
                    </span>
                    {error.errors.length > 0 ? (
                      <span className="text-xs font-medium text-red-700">{error.errors.length} erreur(s)</span>
                    ) : (
                      <span className="text-xs font-medium text-emerald-700">Valide</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Prénom</p>
                      {editable ? (
                        <Input
                          value={error.parsed.firstName || ''}
                          onChange={(e) => onUpdate?.(sourceIndex, 'firstName', e.target.value)}
                          className="h-9"
                        />
                      ) : (
                        <p className="text-sm">{error.parsed.firstName || '—'}</p>
                      )}
                    </div>

                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Nom</p>
                      {editable ? (
                        <Input
                          value={error.parsed.lastName || ''}
                          onChange={(e) => onUpdate?.(sourceIndex, 'lastName', e.target.value)}
                          className="h-9"
                        />
                      ) : (
                        <p className="text-sm">{error.parsed.lastName || '—'}</p>
                      )}
                    </div>

                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Téléphone</p>
                      {editable ? (
                        <Input
                          value={error.parsed.phone || ''}
                          onChange={(e) => onUpdate?.(sourceIndex, 'phone', e.target.value)}
                          className="h-9"
                        />
                      ) : (
                        <p className="text-sm">{error.parsed.phone || '—'}</p>
                      )}
                    </div>

                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Email</p>
                      {editable ? (
                        <Input
                          value={error.parsed.email || ''}
                          onChange={(e) => onUpdate?.(sourceIndex, 'email', e.target.value)}
                          className="h-9"
                        />
                      ) : (
                        <p className="text-sm break-all">{error.parsed.email || '—'}</p>
                      )}
                    </div>

                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">CNI</p>
                      {editable ? (
                        <Input
                          value={error.parsed.cni || ''}
                          onChange={(e) => onUpdate?.(sourceIndex, 'cni', e.target.value)}
                          className="h-9"
                        />
                      ) : (
                        <p className="text-sm break-all">{error.parsed.cni || '—'}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="mb-1 text-xs text-muted-foreground">Erreurs</p>
                    {error.errors.length > 0 ? (
                      <div className="space-y-1">
                        {error.errors.map((err, i) => (
                          <div key={i} className="flex gap-2 text-red-700 text-sm">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <span className="break-words">{err}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-emerald-700 text-sm">✓ Valide</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ligne</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>CNI</TableHead>
                    <TableHead className="max-w-xs">Erreurs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedErrorsWithIndex.map(({ error, sourceIndex, key }) => (
                    <TableRow key={key} className={error.errors.length > 0 ? 'bg-red-50' : 'bg-green-50'}>
                      <TableCell className="font-mono text-sm">{error.rowNumber}</TableCell>
                      <TableCell>
                        {editable ? (
                          <Input
                            value={error.parsed.firstName || ''}
                            onChange={(e) => onUpdate?.(sourceIndex, 'firstName', e.target.value)}
                            className="h-9"
                          />
                        ) : (
                          error.parsed.firstName
                        )}
                      </TableCell>
                      <TableCell>
                        {editable ? (
                          <Input
                            value={error.parsed.lastName || ''}
                            onChange={(e) => onUpdate?.(sourceIndex, 'lastName', e.target.value)}
                            className="h-9"
                          />
                        ) : (
                          error.parsed.lastName
                        )}
                      </TableCell>
                      <TableCell>
                        {editable ? (
                          <Input
                            value={error.parsed.phone || ''}
                            onChange={(e) => onUpdate?.(sourceIndex, 'phone', e.target.value)}
                            className="h-9"
                          />
                        ) : (
                          error.parsed.phone
                        )}
                      </TableCell>
                      <TableCell>
                        {editable ? (
                          <Input
                            value={error.parsed.email || ''}
                            onChange={(e) => onUpdate?.(sourceIndex, 'email', e.target.value)}
                            className="h-9"
                          />
                        ) : (
                          error.parsed.email
                        )}
                      </TableCell>
                      <TableCell>
                        {editable ? (
                          <Input
                            value={error.parsed.cni || ''}
                            onChange={(e) => onUpdate?.(sourceIndex, 'cni', e.target.value)}
                            className="h-9"
                          />
                        ) : (
                          error.parsed.cni
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {error.errors.length > 0 ? (
                          <div className="space-y-1">
                            {error.errors.map((err, i) => (
                              <div key={i} className="flex gap-2 text-red-700">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                <span className="break-words">{err}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-green-700">✓ Valide</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-between items-center">
              <Button onClick={() => setPage(page - 1)} disabled={!hasPrev} variant="outline">
                Précédent
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} sur {totalPages}
              </span>
              <Button onClick={() => setPage(page + 1)} disabled={!hasNext} variant="outline">
                Suivant
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Aucune erreur trouvée</p>
        </div>
      )}
    </div>
  )
}
