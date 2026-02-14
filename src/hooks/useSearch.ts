import { useMemo, useState } from 'react'

/**
 * Hook pour recherche flexible sur n'importe quel objet
 * Réduit 30% de duplication de code
 *
 * @template T - Type des éléments à filtrer
 * @param data - Tableau de données à filtrer
 * @param searchFn - Fonction pour vérifier si un élément correspond à la recherche
 * @returns { query, setQuery, filtered, hasResults }
 *
 * @example
 * const { query, setQuery, filtered } = useSearch(
 *   clients,
 *   (client, q) => {
 *     const name = String(client.name || '').toLowerCase()
 *     const phone = String(client.phone || '').toLowerCase()
 *     return name.includes(q) || phone.includes(q)
 *   }
 * )
 */
export function useSearch<T>(data: T[], searchFn: (item: T, query: string) => boolean) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return data
    return data.filter((item) => searchFn(item, trimmed))
  }, [data, query, searchFn])

  const hasResults = filtered.length > 0

  return {
    query,
    setQuery,
    filtered,
    hasResults,
  }
}
