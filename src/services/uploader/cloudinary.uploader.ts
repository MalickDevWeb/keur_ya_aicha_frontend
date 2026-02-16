import type { FileUploader, UploadProgressCallback, UploadResult } from './file-uploader.interface'

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY
const CLOUDINARY_SIGN_URL = import.meta.env.VITE_CLOUDINARY_SIGN_URL
const API_BASE_URL = import.meta.env.VITE_API_URL

type CloudinaryResourceType = 'image' | 'video' | 'raw' | 'auto'

const getResourceType = (file: File): CloudinaryResourceType => {
  const mimeType = (file.type || '').toLowerCase()
  const fileName = (file.name || '').toLowerCase()

  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'

  // PDFs and most office documents are more reliable via `raw/upload`.
  if (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('application/') ||
    fileName.endsWith('.pdf') ||
    fileName.endsWith('.doc') ||
    fileName.endsWith('.docx')
  ) {
    return 'raw'
  }

  return 'auto'
}

const getUploadUrl = (resourceType: CloudinaryResourceType): string => {
  if (!CLOUDINARY_CLOUD_NAME) return ''
  return `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`
}

type SignedUploadParams = {
  api_key: string
  timestamp: number
  signature: string
}

const getFallbackSignUrls = (): string[] => {
  const urls: string[] = []
  if (CLOUDINARY_SIGN_URL) {
    urls.push(String(CLOUDINARY_SIGN_URL).trim())
  }
  if (API_BASE_URL) {
    urls.push(`${String(API_BASE_URL).replace(/\/$/, '')}/sign`)
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    urls.push(`${String(window.location.origin).replace(/\/$/, '')}/sign`)
  }
  return [...new Set(urls.filter(Boolean))]
}

const parseCloudinaryError = (status: number, responseText: string, statusText?: string): Error => {
  try {
    const payload = JSON.parse(responseText) as { error?: { message?: string } }
    const cloudinaryMessage = payload?.error?.message
    if (cloudinaryMessage) {
      return new Error(`Upload failed (${status}): ${cloudinaryMessage}`)
    }
  } catch {
    // ignore parse errors
  }
  const normalizedStatusText = (statusText || '').trim()
  if (normalizedStatusText) {
    return new Error(`Upload failed (${status}): ${normalizedStatusText}`)
  }
  return new Error(`Upload failed (${status})`)
}

export class CloudinaryUploader implements FileUploader {
  private isUnsignedConfigured(): boolean {
    return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET)
  }

  private isSignedConfigured(): boolean {
    return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && getFallbackSignUrls().length > 0)
  }

  isConfigured(): boolean {
    return this.isUnsignedConfigured() || this.isSignedConfigured()
  }

  private async getSignedUploadParams(folder?: string): Promise<SignedUploadParams> {
    const signUrls = getFallbackSignUrls()
    if (signUrls.length === 0) {
      throw new Error('Cloudinary sign URL is not configured')
    }

    let lastError: Error | null = null

    for (const signUrl of signUrls) {
      try {
        const response = await fetch(signUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(folder ? { folder } : {}),
        })

        if (!response.ok) {
          throw new Error(`Signature request failed (${response.status})`)
        }

        const payload = (await response.json()) as Partial<SignedUploadParams>
        if (!payload?.api_key || !payload?.timestamp || !payload?.signature) {
          throw new Error('Invalid signature payload received from sign server')
        }

        return {
          api_key: payload.api_key,
          timestamp: Number(payload.timestamp),
          signature: payload.signature,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown error'
        lastError = new Error(`Sign server ${signUrl} failed: ${message}`)
      }
    }

    throw lastError || new Error('Failed to obtain upload signature')
  }

  private uploadWithXhr(
    formData: FormData,
    uploadUrl: string,
    options?: { onProgress?: UploadProgressCallback }
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && options?.onProgress) {
          const percentage = Math.round((event.loaded / event.total) * 100)
          options.onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage,
          })
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            resolve({
              id: data.public_id,
              url: data.url,
              secureUrl: data.secure_url,
              format: data.format,
              bytes: data.bytes,
              createdAt: data.created_at,
            })
          } catch {
            reject(new Error('Failed to parse Cloudinary response'))
          }
          return
        }

        reject(parseCloudinaryError(xhr.status, xhr.responseText, xhr.statusText))
      }

      xhr.onerror = () => reject(new Error('Network error during upload'))
      xhr.onabort = () => reject(new Error('Upload aborted'))

      xhr.open('POST', uploadUrl)
      xhr.send(formData)
    })
  }

  private async uploadSigned(
    file: File,
    options?: { folder?: string; onProgress?: UploadProgressCallback }
  ): Promise<UploadResult> {
    const uploadUrl = getUploadUrl(getResourceType(file))
    const signatureData = await this.getSignedUploadParams(options?.folder)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', signatureData.api_key)
    formData.append('timestamp', String(signatureData.timestamp))
    formData.append('signature', signatureData.signature)
    if (options?.folder) {
      formData.append('folder', options.folder)
    }
    return this.uploadWithXhr(formData, uploadUrl, options)
  }

  private uploadUnsigned(
    file: File,
    options?: { folder?: string; onProgress?: UploadProgressCallback }
  ): Promise<UploadResult> {
    if (!CLOUDINARY_UPLOAD_PRESET) {
      throw new Error('Cloudinary upload preset is missing for unsigned upload.')
    }
    const uploadUrl = getUploadUrl(getResourceType(file))
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    if (options?.folder) {
      formData.append('folder', options.folder)
    }
    return this.uploadWithXhr(formData, uploadUrl, options)
  }

  async uploadFile(
    file: File,
    options?: { folder?: string; onProgress?: UploadProgressCallback }
  ): Promise<UploadResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'Cloudinary is not configured. Configure either unsigned preset or signed upload (API key + sign URL).'
      )
    }

    let signedAttemptError: unknown = null
    if (this.isSignedConfigured()) {
      try {
        return await this.uploadSigned(file, options)
      } catch (signedError) {
        signedAttemptError = signedError
        if (!this.isUnsignedConfigured()) throw signedError
      }
    }

    try {
      return await this.uploadUnsigned(file, options)
    } catch (unsignedError) {
      if (signedAttemptError instanceof Error && unsignedError instanceof Error) {
        throw new Error(`${unsignedError.message} (signed fallback: ${signedAttemptError.message})`)
      }
      throw unsignedError
    }
  }

  async uploadMultipleFiles(
    files: File[],
    options?: { folder?: string; onProgress?: UploadProgressCallback }
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = []

    for (const file of files) {
      const result = await this.uploadFile(file, options)
      results.push(result)
    }

    return results
  }
}
