import { createUploader } from '@/services/uploader/uploader.factory'

// Upload a File/Blob via the active uploader and return the secure URL
export async function uploadToCloudinary(file: File | Blob): Promise<string> {
  const uploader = createUploader()
  const result = await uploader.uploadFile(file instanceof File ? file : new File([file], 'upload'))
  const secureUrl = result.secureUrl || result.url
  if (!secureUrl) throw new Error('Uploader did not return a URL')
  return secureUrl
}
