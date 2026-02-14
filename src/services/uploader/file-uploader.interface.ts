export interface UploadResult {
  id: string
  url: string
  secureUrl?: string
  format?: string
  bytes?: number
  createdAt?: string
}

export interface UploadProgressEvent {
  loaded: number
  total: number
  percentage: number
}

export type UploadProgressCallback = (event: UploadProgressEvent) => void

export interface FileUploader {
  uploadFile(
    file: File,
    options?: {
      folder?: string
      onProgress?: UploadProgressCallback
    }
  ): Promise<UploadResult>

  uploadMultipleFiles(
    files: File[],
    options?: {
      folder?: string
      onProgress?: UploadProgressCallback
    }
  ): Promise<UploadResult[]>

  isConfigured(): boolean
}
