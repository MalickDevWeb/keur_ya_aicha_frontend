import type { StoredErrors } from '@/pages/admin/imports/utils'
export type { StoredErrors }

type InsertedRow = StoredErrors['inserted'][number]
type ErrorRow = StoredErrors['errors'][number]

const CSV_HEADERS = [
  'type',
  'row',
  'firstName',
  'lastName',
  'phone',
  'email',
  'status',
  'message',
]

const escapeCsv = (value: unknown) => {
  const str = String(value ?? '')
  if (str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  if (str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str}"`
  }
  return str
}

export function buildReportCsv(
  inserted: InsertedRow[] | undefined,
  errors: ErrorRow[]
): string {
  const lines: string[] = []
  lines.push(CSV_HEADERS.join(','))

  if (inserted?.length) {
    inserted.forEach((row) => {
      lines.push(
        [
          'SUCCESS',
          '',
          row.firstName ?? '',
          row.lastName ?? '',
          row.phone ?? '',
          row.email ?? '',
          'Imported',
          'none',
        ]
          .map(escapeCsv)
          .join(',')
      )
    })
  }

  errors.forEach((row) => {
    lines.push(
      [
        'ERROR',
        row.rowNumber ?? '',
        row.parsed.firstName ?? '',
        row.parsed.lastName ?? '',
        row.parsed.phone ?? '',
        row.parsed.email ?? '',
        'Error',
        row.errors.join(' | '),
      ]
        .map(escapeCsv)
        .join(',')
    )
  })

  return lines.join('\r\n')
}
