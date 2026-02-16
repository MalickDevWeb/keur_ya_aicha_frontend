import { createUploader } from '@/services/uploader/uploader.factory'
import { apiFetch } from '@/services/http'

// Upload a File/Blob via the active uploader and return the secure URL
export async function uploadToCloudinary(file: File | Blob): Promise<string> {
  const uploader = createUploader()
  const normalizedFile =
    file instanceof File ? file : new File([file], 'upload', { type: file.type || 'application/octet-stream' })
  const result = await uploader.uploadFile(normalizedFile)
  const secureUrl = result.secureUrl || result.url
  if (!secureUrl) throw new Error('Uploader did not return a URL')
  return secureUrl
}

export async function getCloudinaryOpenUrl(url: string): Promise<string> {
  const rawUrl = String(url || '').trim()
  if (!rawUrl) return rawUrl
  if (!rawUrl.includes('res.cloudinary.com')) return rawUrl

  try {
    const payload = await apiFetch<{ url?: string }>('/cloudinary/open-url', {
      method: 'POST',
      body: JSON.stringify({ url: rawUrl }),
    })
    return String(payload?.url || rawUrl)
  } catch {
    return rawUrl
  }
}
