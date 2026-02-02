/**
 * Cloudinary Upload Service
 * Handles image and file uploads to Cloudinary
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'djp423xyr'
const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY || '858647214159638'
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default'

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  url: string
  format: string
  width?: number
  height?: number
  bytes: number
  created_at: string
}

export interface UploadProgressEvent {
  loaded: number
  total: number
  percentage: number
}

type UploadProgressCallback = (event: UploadProgressEvent) => void

/**
 * Upload an image file to Cloudinary
 * @param file - The file to upload
 * @param folder - Optional folder name in Cloudinary
 * @param onProgress - Optional progress callback
 * @returns Promise with the upload result
 */
export async function uploadImage(
  file: File,
  folder: string = 'keuryaicha',
  onProgress?: UploadProgressCallback
): Promise<CloudinaryUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  formData.append('cloud_name', CLOUDINARY_CLOUD_NAME)

  if (folder) {
    formData.append('folder', folder)
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percentage = Math.round((event.loaded / event.total) * 100)
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage,
        })
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText)
          resolve(result)
        } catch (error) {
          reject(new Error('Failed to parse upload response'))
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText)
          reject(new Error(error.error?.message || 'Upload failed'))
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'))
    })

    xhr.open('POST', CLOUDINARY_UPLOAD_URL)
    xhr.send(formData)
  })
}

/**
 * Upload multiple images to Cloudinary
 * @param files - Array of files to upload
 * @param folder - Optional folder name
 * @param onProgress - Optional progress callback
 * @returns Promise with array of upload results
 */
export async function uploadMultipleImages(
  files: File[],
  folder: string = 'keuryaicha',
  onProgress?: UploadProgressCallback
): Promise<CloudinaryUploadResult[]> {
  const results: CloudinaryUploadResult[] = []

  for (const file of files) {
    const result = await uploadImage(file, folder, onProgress)
    results.push(result)
  }

  return results
}

/**
 * Get the optimized image URL from Cloudinary
 * @param publicId - The public ID of the image
 * @param transformations - Optional transformation options
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    crop?: 'fill' | 'fit' | 'scale' | 'thumb'
    quality?: 'auto' | number
    format?: 'auto' | 'webp' | 'jpg' | 'png'
  } = {}
): string {
  const { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = options

  let transformations = `c_${crop},q_${quality},f_${format}`

  if (width) transformations += `,w_${width}`
  if (height) transformations += `,h_${height}`

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformations}/${publicId}`
}

/**
 * Delete an image from Cloudinary (requires server-side implementation)
 * Note: This is a placeholder - actual deletion requires a backend API call
 * @param publicId - The public ID of the image to delete
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  // Note: Cloudinary deletion requires server-side signing
  // This should be called through your backend API
  console.warn('Image deletion requires backend implementation')
  return false
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    CLOUDINARY_CLOUD_NAME &&
    CLOUDINARY_API_KEY &&
    CLOUDINARY_UPLOAD_PRESET &&
    CLOUDINARY_CLOUD_NAME !== '' &&
    CLOUDINARY_API_KEY !== ''
  )
}

export default {
  uploadImage,
  uploadMultipleImages,
  getOptimizedImageUrl,
  deleteImage,
  isCloudinaryConfigured,
}
