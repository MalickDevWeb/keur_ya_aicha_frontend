import { useMemo, useState } from 'react'

/**
 * Hook pour la pagination
 *
 * @template T - Type des éléments paginés
 * @param data - Tableau de données complet
 * @param pageSize - Nombre d'éléments par page (défaut: 10)
 * @returns Données paginées et contrôles de pagination
 *
 * @example
 * const { data: items, page, setPage, totalPages, hasNext, hasPrev } = usePagination(allItems, 20)
 */
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
    isEmpty: data.length === 0,
  }
}
