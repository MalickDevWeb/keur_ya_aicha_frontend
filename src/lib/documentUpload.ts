export type DocumentUploadPreviewKind = 'image' | 'pdf' | 'file'

type JsPdfInstance = {
  internal: {
    pageSize: {
      getWidth: () => number
      getHeight: () => number
    }
  }
  addImage: (
    data: string,
    format: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => void
  output: (type: 'blob') => Blob
}

type JsPdfConstructor = new (options: {
  orientation?: 'portrait' | 'landscape'
  unit: string
  format: string
}) => JsPdfInstance

function getLowerFileName(file: File | null | undefined): string {
  return String(file?.name || '').trim().toLowerCase()
}

export function isImageDocumentFile(file: File | null | undefined): file is File {
  if (!file) return false
  const mimeType = String(file.type || '').trim().toLowerCase()
  if (mimeType.startsWith('image/')) return true
  return /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(getLowerFileName(file))
}

export function isPdfDocumentFile(file: File | null | undefined): file is File {
  if (!file) return false
  const mimeType = String(file.type || '').trim().toLowerCase()
  if (mimeType === 'application/pdf') return true
  return /\.pdf$/i.test(getLowerFileName(file))
}

export function getDocumentUploadPreviewKind(file: File | null | undefined): DocumentUploadPreviewKind {
  if (isImageDocumentFile(file)) return 'image'
  if (isPdfDocumentFile(file)) return 'pdf'
  return 'file'
}

export function getDocumentUploadLabel(file: File | null | undefined): string {
  const raw = String(file?.name || '').trim()
  if (!raw) return 'Document'
  return raw.replace(/\.[^/.]+$/, '').trim() || raw
}

function buildPdfFileName(file: File): string {
  const baseName = getDocumentUploadLabel(file).replace(/[\\/:*?"<>|]+/g, '-').trim() || 'document'
  return `${baseName}.pdf`
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Impossible de lire le fichier image.'))
    reader.readAsDataURL(file)
  })
}

function chargerImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Impossible de charger l’image pour la conversion PDF.'))
    image.src = dataUrl
  })
}

export async function convertImageDocumentToPdfFile(file: File): Promise<File> {
  if (!isImageDocumentFile(file)) return file

  const dataUrl = await readFileAsDataUrl(file)
  const image = await chargerImage(dataUrl)
  const naturalWidth = image.naturalWidth || image.width || 1
  const naturalHeight = image.naturalHeight || image.height || 1
  const maxDimension = 2200
  const ratio = Math.min(1, maxDimension / Math.max(naturalWidth, naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(naturalWidth * ratio))
  canvas.height = Math.max(1, Math.round(naturalHeight * ratio))

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Impossible de préparer l’image pour la conversion PDF.')
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92)
  const jspdfModule = (await import('jspdf')) as unknown as { jsPDF: JsPdfConstructor }
  const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait'
  const pdf = new jspdfModule.jsPDF({ orientation, unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const renderRatio = Math.min((pageWidth - 40) / canvas.width, (pageHeight - 40) / canvas.height)
  const renderWidth = canvas.width * renderRatio
  const renderHeight = canvas.height * renderRatio
  const offsetX = (pageWidth - renderWidth) / 2
  const offsetY = (pageHeight - renderHeight) / 2

  pdf.addImage(jpegDataUrl, 'JPEG', offsetX, offsetY, renderWidth, renderHeight)
  const blob = pdf.output('blob')

  return new File([blob], buildPdfFileName(file), {
    type: 'application/pdf',
    lastModified: Date.now(),
  })
}

export async function prepareDocumentUploadFile(
  file: File
): Promise<{ file: File; wasConvertedFromImage: boolean }> {
  if (!isImageDocumentFile(file)) {
    return { file, wasConvertedFromImage: false }
  }

  return {
    file: await convertImageDocumentToPdfFile(file),
    wasConvertedFromImage: true,
  }
}
