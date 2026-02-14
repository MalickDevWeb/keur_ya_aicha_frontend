import type { FileUploader, UploadProgressCallback, UploadResult } from './file-uploader.interface'

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const CLOUDINARY_UPLOAD_URL = CLOUDINARY_CLOUD_NAME
  ? `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`
  : ''

export class CloudinaryUploader implements FileUploader {
  isConfigured(): boolean {
    return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET)
  }

  uploadFile(
    file: File,
    options?: { folder?: string; onProgress?: UploadProgressCallback }
  ): Promise<UploadResult> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary is not configured')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET as string)
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME as string)

    if (options?.folder) {
      formData.append('folder', options.folder)
    }

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
        } else {
          reject(new Error(`Upload failed (${xhr.status})`))
        }
      }

      xhr.onerror = () => reject(new Error('Network error during upload'))
      xhr.onabort = () => reject(new Error('Upload aborted'))

      xhr.open('POST', CLOUDINARY_UPLOAD_URL)
      xhr.send(formData)
    })
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
