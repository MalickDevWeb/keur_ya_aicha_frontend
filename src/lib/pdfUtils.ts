type PdfDocumentInput = {
  payerName?: string
  clientName?: string
  payerPhone?: string
  clientPhone?: string
  amount?: number
  value?: number
  uploadedAt?: string | number | Date
  note?: string
}

type Html2Canvas = (element: HTMLElement, options?: { scale?: number }) => Promise<HTMLCanvasElement>

type JsPdfInstance = {
  internal: {
    pageSize: {
      getWidth: () => number
      getHeight: () => number
    }
  }
  addImage: (data: string, format: string, x: number, y: number, width: number, height: number) => void
  output: (type: 'blob') => Blob
  getImageProperties?: (data: string) => { width: number; height: number }
}

type JsPdfConstructor = new (options: { unit: string; format: string }) => JsPdfInstance

// Utility to generate a styled PDF from a document object and offer download + share
export async function generatePdfForDocument(doc: PdfDocumentInput) {
  // dynamic imports so the app still builds if deps are not installed yet
  let html2canvasModule: unknown
  let jspdfModule: unknown
  try {
    html2canvasModule = await import('html2canvas')
    jspdfModule = await import('jspdf')
  } catch {
    throw new Error('Please install html2canvas and jspdf: npm install html2canvas jspdf')
  }

  const html2canvas = (html2canvasModule as { default?: Html2Canvas }).default
    ?? (html2canvasModule as Html2Canvas)
  const { jsPDF } = jspdfModule as { jsPDF: JsPdfConstructor }

  // Build a small HTML receipt element
  const wrapper = document.createElement('div')
  wrapper.style.width = '794px' // ~A4 at 96dpi width
  wrapper.style.padding = '24px'
  wrapper.style.boxSizing = 'border-box'
  wrapper.style.fontFamily = 'Inter, Arial, sans-serif'
  wrapper.style.color = '#0f172a'
  wrapper.style.background = '#ffffff'

  // Header with logo + app name
  const header = document.createElement('div')
  header.style.display = 'flex'
  header.style.alignItems = 'center'
  header.style.gap = '12px'

  // try to use public/logo.png if present, otherwise fall back to inline SVG brand block
  const tryLoadLogo = () =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('logo not found'))
      img.src = '/logo.png'
    })

  try {
    const logoImg = await tryLoadLogo()
    const imgEl = document.createElement('img')
    imgEl.src = logoImg.src
    imgEl.style.width = '72px'
    imgEl.style.height = '72px'
    imgEl.style.objectFit = 'contain'
    imgEl.alt = 'Logo'
    header.appendChild(imgEl)
  } catch {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '72')
    svg.setAttribute('height', '72')
    svg.setAttribute('viewBox', '0 0 72 72')

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('width', '72')
    rect.setAttribute('height', '72')
    rect.setAttribute('rx', '12')
    rect.setAttribute('fill', '#0ea5a4')

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    text.setAttribute('x', '50%')
    text.setAttribute('y', '52%')
    text.setAttribute('dominant-baseline', 'middle')
    text.setAttribute('text-anchor', 'middle')
    text.setAttribute('font-size', '28')
    text.setAttribute('font-family', 'Arial, sans-serif')
    text.setAttribute('fill', '#ffffff')
    text.textContent = 'KY'

    svg.appendChild(rect)
    svg.appendChild(text)
    header.appendChild(svg)
  }

  const title = document.createElement('div')
  const appName = document.createElement('div')
  appName.textContent = 'KeurYaAicha'
  appName.style.fontSize = '20px'
  appName.style.fontWeight = '700'
  appName.style.color = '#0ea5a4'
  title.appendChild(appName)
  const subtitle = document.createElement('div')
  subtitle.textContent = 'Reçu de paiement'
  subtitle.style.fontSize = '12px'
  subtitle.style.color = '#475569'
  title.appendChild(subtitle)
  header.appendChild(title)

  wrapper.appendChild(header)

  const hr = document.createElement('hr')
  hr.style.margin = '16px 0'
  wrapper.appendChild(hr)

  const content = document.createElement('div')
  content.style.display = 'flex'
  content.style.justifyContent = 'space-between'

  const left = document.createElement('div')
  left.style.maxWidth = '60%'
  const leftTitle = document.createElement('div')
  leftTitle.style.fontSize = '14px'
  leftTitle.style.fontWeight = '600'
  leftTitle.textContent = 'Payeur'
  const leftName = document.createElement('div')
  leftName.style.marginTop = '6px'
  leftName.style.fontSize = '13px'
  leftName.textContent = doc.payerName || doc.clientName || ''
  const leftPhone = document.createElement('div')
  leftPhone.style.marginTop = '8px'
  leftPhone.style.fontSize = '12px'
  leftPhone.style.color = '#64748b'
  leftPhone.textContent = doc.payerPhone || doc.clientPhone || ''
  left.appendChild(leftTitle)
  left.appendChild(leftName)
  left.appendChild(leftPhone)

  const right = document.createElement('div')
  right.style.textAlign = 'right'
  const rightTitle = document.createElement('div')
  rightTitle.style.fontSize = '12px'
  rightTitle.style.color = '#64748b'
  rightTitle.textContent = 'Montant'
  const rightAmount = document.createElement('div')
  rightAmount.style.fontSize = '20px'
  rightAmount.style.fontWeight = '700'
  rightAmount.style.color = '#0f172a'
  rightAmount.style.marginTop = '6px'
  const amountValue = typeof doc.amount === 'number'
    ? doc.amount
    : typeof doc.value === 'number'
      ? doc.value
      : 0
  rightAmount.textContent = `${amountValue.toLocaleString('fr-FR')} FCFA`
  const rightDate = document.createElement('div')
  rightDate.style.fontSize = '12px'
  rightDate.style.color = '#64748b'
  rightDate.style.marginTop = '8px'
  const dateValue = doc.uploadedAt ? new Date(doc.uploadedAt) : new Date()
  rightDate.textContent = `Date: ${dateValue.toLocaleDateString('fr-FR')}`
  right.appendChild(rightTitle)
  right.appendChild(rightAmount)
  right.appendChild(rightDate)

  content.appendChild(left)
  content.appendChild(right)
  wrapper.appendChild(content)

  // Notes / details
  if (doc.note) {
    const note = document.createElement('div')
    note.style.marginTop = '18px'
    const noteTitle = document.createElement('div')
    noteTitle.style.fontSize = '12px'
    noteTitle.style.color = '#64748b'
    noteTitle.textContent = 'Note'
    const noteBody = document.createElement('div')
    noteBody.style.marginTop = '6px'
    noteBody.style.fontSize = '13px'
    noteBody.textContent = doc.note
    note.appendChild(noteTitle)
    note.appendChild(noteBody)
    wrapper.appendChild(note)
  }

  // Footer
  const footer = document.createElement('div')
  footer.style.marginTop = '28px'
  footer.style.fontSize = '11px'
  footer.style.color = '#94a3b8'
  footer.textContent = 'Merci pour votre paiement.'
  wrapper.appendChild(footer)

  // render to canvas
  document.body.appendChild(wrapper)
  const canvas = await html2canvas(wrapper as HTMLElement, { scale: 2, logging: false, useCORS: true })
  const imgData = canvas.toDataURL('image/png')
  document.body.removeChild(wrapper)

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  // image width fits page with small margins
  const imgProps = pdf.getImageProperties ? pdf.getImageProperties(imgData) : { width: canvas.width, height: canvas.height }
  const imgWidth = pageWidth - 48
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width
  pdf.addImage(imgData, 'PNG', 24, 24, imgWidth, imgHeight)

  const blob = pdf.output('blob')
  return blob
}

export function downloadBlob(blob: Blob, filename = 'document.pdf') {
  const a = document.createElement('a')
  const url = URL.createObjectURL(blob)
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export async function shareBlobViaWebShare(blob: Blob, filename = 'document.pdf', text = '') {
  try {
    const file = new File([blob], filename, { type: 'application/pdf' })
    const shareApi = navigator as Navigator & {
      canShare?: (data: { files: File[] }) => boolean
      share?: (data: { files: File[]; title?: string; text?: string }) => Promise<void>
    }
    if (shareApi.canShare && shareApi.canShare({ files: [file] })) {
      await shareApi.share?.({ files: [file], title: filename, text })
      return true
    }
  } catch {
    // ignore
  }
  return false
}

export async function uploadBlobToFileIo(blob: Blob, filename = 'document.pdf') {
  try {
    const form = new FormData()
    form.append('file', new File([blob], filename, { type: 'application/pdf' }))
    // expires parameter: 1w = one week
    const res = await fetch('https://file.io/?expires=1w', {
      method: 'POST',
      body: form,
    })
    const data = await res.json()
    // file.io returns { success: true, link: 'https://file.io/...' }
    if (data && data.success && data.link) return data.link
    if (data && data.link) return data.link
    throw new Error('Upload failed')
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Upload to file.io failed'
    throw new Error(message)
  }
}
