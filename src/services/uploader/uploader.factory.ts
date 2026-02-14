import type { FileUploader } from './file-uploader.interface'
import { CloudinaryUploader } from './cloudinary.uploader'

export function createUploader(): FileUploader {
  return new CloudinaryUploader()
}
