// Utility to generate a styled PDF from a document object and offer download + share
export async function generatePdfForDocument(doc: any) {
  // dynamic imports so the app still builds if deps are not installed yet
  let html2canvasModule: any
  let jspdfModule: any
  try {
    html2canvasModule = await import('html2canvas')
    jspdfModule = await import('jspdf')
  } catch (e) {
    throw new Error('Please install html2canvas and jspdf: npm install html2canvas jspdf')
  }

  const html2canvas = html2canvasModule.default || html2canvasModule
  const { jsPDF } = jspdfModule

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
  } catch (e) {
    const brandSvg = `
      <svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
        <rect width="72" height="72" rx="12" fill="#0ea5a4" />
        <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-size="28" font-family="Arial, sans-serif" fill="#ffffff">KY</text>
      </svg>
    `
    const logoWrapper = document.createElement('div')
    logoWrapper.innerHTML = brandSvg
    header.appendChild(logoWrapper)
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
  left.innerHTML = `
    <div style="font-size:14px; font-weight:600;">Payeur</div>
    <div style="margin-top:6px; font-size:13px">${doc.payerName || doc.clientName || ''}</div>
    <div style="margin-top:8px; font-size:12px; color:#64748b">${doc.payerPhone || doc.clientPhone || ''}</div>
  `

  const right = document.createElement('div')
  right.style.textAlign = 'right'
  right.innerHTML = `
    <div style="font-size:12px; color:#64748b">Montant</div>
    <div style="font-size:20px; font-weight:700; color:#0f172a; margin-top:6px">${(doc.amount || doc.value || 0).toLocaleString('fr-FR')} FCFA</div>
    <div style="font-size:12px; color:#64748b; margin-top:8px">Date: ${new Date(doc.uploadedAt || Date.now()).toLocaleDateString('fr-FR')}</div>
  `

  content.appendChild(left)
  content.appendChild(right)
  wrapper.appendChild(content)

  // Notes / details
  if (doc.note) {
    const note = document.createElement('div')
    note.style.marginTop = '18px'
    note.innerHTML = `<div style="font-size:12px; color:#64748b">Note</div><div style="margin-top:6px; font-size:13px">${doc.note}</div>`
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
  const canvas = await html2canvas(wrapper as HTMLElement, { scale: 2 })
  const imgData = canvas.toDataURL('image/png')
  document.body.removeChild(wrapper)

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  // image width fits page with small margins
  const imgProps = (pdf as any).getImageProperties(imgData)
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
    if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
      await (navigator as any).share({ files: [file], title: filename, text })
      return true
    }
  } catch (e) {
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
  } catch (e: any) {
    throw new Error(e?.message || 'Upload to file.io failed')
  }
}
