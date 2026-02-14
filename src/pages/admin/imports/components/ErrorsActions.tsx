import { Download, RotateCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ExcelJS from 'exceljs'
import { buildReportCsv, type StoredErrors } from '@/services/importErrors'

interface ErrorsActionsProps {
  storedErrors: StoredErrors
  onRefresh: () => void
  onDelete: () => void
  isLoading?: boolean
}

/**
 * Action buttons for import error management
 * Extracted from ImportErrors.tsx
 */
export function ErrorsActions({
  storedErrors,
  onRefresh,
  onDelete,
  isLoading = false,
}: ErrorsActionsProps) {
  const handleDownloadCsv = () => {
    const csv = buildReportCsv(storedErrors.inserted, storedErrors.errors)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    import('@/lib/pdfUtils').then(({ downloadBlob }) => {
      downloadBlob(blob, `import-errors-${storedErrors.id}.csv`)
    })
  }

  const handleDownloadExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Import Report')

    // Headers
    const headers = ['Type', 'Row', 'First Name', 'Last Name', 'Phone', 'Email', 'Status', 'Message']
    worksheet.addRow(headers)
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    }
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // Success rows
    if (storedErrors.inserted?.length) {
      storedErrors.inserted.forEach((item) => {
        worksheet.addRow([
          'SUCCESS',
          '',
          item.firstName,
          item.lastName,
          item.phone,
          item.email ?? '',
          'Importé',
          'aucun',
        ])
      })
    }

    // Error rows
    storedErrors.errors.forEach(({ rowNumber, errors, parsed }) => {
      worksheet.addRow([
        'ERROR',
        rowNumber,
        parsed.firstName ?? '',
        parsed.lastName ?? '',
        parsed.phone ?? '',
        parsed.email ?? '',
        'Erreur',
        errors.join(' | '),
      ])
    })

    // Auto-fit columns
    worksheet.columns = worksheet.columns.map((col) => {
      col.width = Math.min(30, Math.max(col.header?.length ?? 10, 15))
      return col
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const { downloadBlob } = await import('@/lib/pdfUtils')
    downloadBlob(blob, `import-errors-${storedErrors.id}.xlsx`)
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button onClick={handleDownloadCsv} variant="outline" disabled={isLoading}>
        <Download className="w-4 h-4 mr-2" />
        CSV
      </Button>
      <Button onClick={handleDownloadExcel} variant="outline" disabled={isLoading}>
        <Download className="w-4 h-4 mr-2" />
        Excel
      </Button>
      <Button onClick={onRefresh} variant="outline" disabled={isLoading}>
        <RotateCw className="w-4 h-4 mr-2" />
        Rafraîchir
      </Button>
      <Button onClick={onDelete} variant="destructive" disabled={isLoading}>
        <Trash2 className="w-4 h-4 mr-2" />
        Supprimer
      </Button>
    </div>
  )
}
