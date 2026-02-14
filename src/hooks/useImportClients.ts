import { useCallback, useEffect, useState } from 'react'
import { getSetting } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import type { ClientImportMapping, ClientImportError } from '@/lib/importClients'
import { DEFAULT_IMPORT_ALIASES, buildRow, validateRow } from '@/lib/importClients'
import { buildDuplicateLookup, buildDuplicateMessage } from '@/pages/admin/imports/utils'
import { normalizeEmailForCompare, normalizePhoneForCompare } from '@/validators/frontend'
import type { Client } from '@/lib/types'

const REQUIRED_FIELDS = ['firstName', 'lastName', 'phone'] as const

interface UseImportClientsOptions {
  clients: Client[]
}

interface UseImportClientsState {
  fileName: string
  headers: string[]
  rows: Array<(string | number | Date | null)[]>
  mapping: ClientImportMapping
  errors: ClientImportError[]
  overrides: Record<number, Record<string, string>>
  importAliases: Partial<Record<keyof ClientImportMapping, string[]>> | null
  isLoading: boolean
}

export function useImportClients({ clients }: UseImportClientsOptions) {
  const { toast } = useToast()
  const [state, setState] = useState<UseImportClientsState>({
    fileName: '',
    headers: [],
    rows: [],
    mapping: {},
    errors: [],
    overrides: {},
    importAliases: null,
    isLoading: true,
  })

  const { ownerByEmail, ownerByPhone } = buildDuplicateLookup(clients)

  // Load import aliases on mount
  useEffect(() => {
    let mounted = true
    async function loadAliases() {
      try {
        const raw = await getSetting('import_clients_aliases')
        if (!mounted) return
        const parsed = raw ? JSON.parse(raw) : DEFAULT_IMPORT_ALIASES
        setState((s) => ({
          ...s,
          importAliases: parsed && typeof parsed === 'object' ? parsed : DEFAULT_IMPORT_ALIASES,
          isLoading: false,
        }))
      } catch {
        setState((s) => ({ ...s, importAliases: DEFAULT_IMPORT_ALIASES, isLoading: false }))
      }
    }
    loadAliases()
    return () => {
      mounted = false
    }
  }, [])

  const setFileName = useCallback((fileName: string) => {
    setState((s) => ({ ...s, fileName }))
  }, [])

  const setHeaders = useCallback((headers: string[]) => {
    setState((s) => ({ ...s, headers }))
  }, [])

  const setRows = useCallback((rows: Array<(string | number | Date | null)[]>) => {
    setState((s) => ({ ...s, rows }))
  }, [])

  const setMapping = useCallback((mapping: ClientImportMapping) => {
    setState((s) => ({ ...s, mapping }))
  }, [])

  const setErrors = useCallback((errors: ClientImportError[]) => {
    setState((s) => ({ ...s, errors }))
  }, [])

  const setOverrides = useCallback((overrides: Record<number, Record<string, string>>) => {
    setState((s) => ({ ...s, overrides }))
  }, [])

  const validateMapping = useCallback((): boolean => {
    const missingMapping = REQUIRED_FIELDS.filter((field) => state.mapping[field] === undefined)
    if (missingMapping.length > 0) {
      toast({
        title: 'Mapping incomplet',
        description: `Veuillez mapper: ${missingMapping.join(', ')}`,
        variant: 'destructive',
      })
      return false
    }
    return true
  }, [state.mapping, toast])

  const validateRows = useCallback(
    (rows: Array<(string | number | Date | null)[]>, mapping: ClientImportMapping): ClientImportError[] => {
      const newErrors: ClientImportError[] = []
      const existingPhones = new Set(ownerByPhone.keys())
      const existingEmails = new Set(ownerByEmail.keys())

      const seenPhonesInFile = new Set<string>()
      const seenEmailsInFile = new Set<string>()

      rows.forEach((row, rowIdx) => {
        const parsed = buildRow(row, mapping)
        const rowErrors = validateRow(parsed, rowIdx + 2)

        if (rowErrors.length > 0) {
          newErrors.push({
            rowIndex: rowIdx,
            rowNumber: rowIdx + 2,
            errors: rowErrors,
            parsed,
          })
          return
        }

        const normalizedPhone = normalizePhoneForCompare(parsed.phone || '')
        if (normalizedPhone) {
          if (existingPhones.has(normalizedPhone)) {
            rowErrors.push(buildDuplicateMessage('phone', normalizedPhone, ownerByPhone))
          }
          if (seenPhonesInFile.has(normalizedPhone)) {
            rowErrors.push('Téléphone dupliqué dans le fichier')
          }
          seenPhonesInFile.add(normalizedPhone)
        }

        const normalizedEmail = normalizeEmailForCompare(parsed.email || '')
        if (normalizedEmail) {
          if (existingEmails.has(normalizedEmail)) {
            rowErrors.push(buildDuplicateMessage('email', normalizedEmail, ownerByEmail))
          }
          if (seenEmailsInFile.has(normalizedEmail)) {
            rowErrors.push('Email dupliqué dans le fichier')
          }
          seenEmailsInFile.add(normalizedEmail)
        }

        if (rowErrors.length > 0) {
          newErrors.push({
            rowIndex: rowIdx,
            rowNumber: rowIdx + 2,
            errors: rowErrors,
            parsed,
          })
        }
      })

      return newErrors
    },
    [ownerByPhone, ownerByEmail]
  )

  const validateAndCollect = useCallback(
    (rows: Array<(string | number | Date | null)[]>, mapping: ClientImportMapping, list: Client[]) => {
      const missingMapping = REQUIRED_FIELDS.filter((field) => mapping[field] === undefined)
      if (missingMapping.length > 0) return null

      const { ownerByEmail: byEmail, ownerByPhone: byPhone } = buildDuplicateLookup(list)
      const existingPhones = new Set(byPhone.keys())
      const existingEmails = new Set(byEmail.keys())
      const seenPhonesInFile = new Set<string>()
      const seenEmailsInFile = new Set<string>()

      const nextErrors: ClientImportError[] = []

      rows.forEach((row, rowIdx) => {
        const parsed = buildRow(row, mapping)
        const rowErrors = validateRow(parsed, rowIdx + 2)

        const normalizedPhone = normalizePhoneForCompare(parsed.phone || '')
        if (normalizedPhone) {
          if (existingPhones.has(normalizedPhone)) {
            rowErrors.push(buildDuplicateMessage('phone', normalizedPhone, byPhone))
          }
          if (seenPhonesInFile.has(normalizedPhone)) {
            rowErrors.push('Téléphone dupliqué dans le fichier')
          }
          seenPhonesInFile.add(normalizedPhone)
        }

        const normalizedEmail = normalizeEmailForCompare(parsed.email || '')
        if (normalizedEmail) {
          if (existingEmails.has(normalizedEmail)) {
            rowErrors.push(buildDuplicateMessage('email', normalizedEmail, byEmail))
          }
          if (seenEmailsInFile.has(normalizedEmail)) {
            rowErrors.push('Email dupliqué dans le fichier')
          }
          seenEmailsInFile.add(normalizedEmail)
        }

        if (rowErrors.length > 0) {
          nextErrors.push({
            rowIndex: rowIdx,
            rowNumber: rowIdx + 2,
            errors: rowErrors,
            parsed,
          })
        }
      })

      return nextErrors
    },
    []
  )

  const hasData = state.headers.length > 0 && state.rows.length > 0

  return {
    ...state,
    setFileName,
    setHeaders,
    setRows,
    setMapping,
    setErrors,
    setOverrides,
    validateMapping,
    validateRows,
    validateAndCollect,
    hasData,
    ownerByEmail,
    ownerByPhone,
  }
}
