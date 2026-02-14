import { useCallback, useState } from 'react'
import { createUploader } from '@/services/uploader/uploader.factory'
import type { UploadResult } from '@/services/uploader/file-uploader.interface'

interface UseCloudinaryUploadReturn {
  upload: (file: File, folder?: string) => Promise<UploadResult>
  uploadMultiple: (files: File[], folder?: string) => Promise<UploadResult[]>
  isUploading: boolean
  progress: number
  error: string | null
  reset: () => void
}

export function useCloudinaryUpload(): UseCloudinaryUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setIsUploading(false)
    setProgress(0)
    setError(null)
  }, [])

  const upload = useCallback(
    async (file: File, folder?: string): Promise<UploadResult> => {
      const uploader = createUploader()
      setIsUploading(true)
      setProgress(0)
      setError(null)

      try {
        const result = await uploader.uploadFile(file, {
          folder,
          onProgress: (event) => {
            setProgress(event.percentage)
          },
        })
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed'
        setError(errorMessage)
        throw err
      } finally {
        setIsUploading(false)
      }
    },
    []
  )

  const uploadMultiple = useCallback(
    async (files: File[], folder?: string): Promise<UploadResult[]> => {
      const uploader = createUploader()
      setIsUploading(true)
      setProgress(0)
      setError(null)

      try {
        const results: UploadResult[] = []
        let totalProgress = 0
        const progressPerFile = 100 / files.length

        for (const file of files) {
          const result = await uploader.uploadFile(file, {
            folder,
            onProgress: (event) => {
              const currentProgress = totalProgress + (event.percentage * progressPerFile) / 100
              setProgress(Math.round(currentProgress))
            },
          })
          results.push(result)
          totalProgress += progressPerFile
        }

        return results
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed'
        setError(errorMessage)
        throw err
      } finally {
        setIsUploading(false)
      }
    },
    []
  )

  return {
    upload,
    uploadMultiple,
    isUploading,
    progress,
    error,
    reset,
  }
}

export default useCloudinaryUpload
