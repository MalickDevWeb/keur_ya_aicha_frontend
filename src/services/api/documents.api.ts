import type { DocumentDTO } from '@/dto/backend/responses/DocumentDTO'
import type { DocumentCreateDTO } from '@/dto/backend/requests'
import { createCrudEndpoint } from './endpoint.factory'
import { createUploader } from '@/services/uploader/uploader.factory'
import { generateId } from '@/services/utils/ids'

/**
 * Endpoint CRUD pour les documents
 */
const documentApi = createCrudEndpoint<DocumentDTO, DocumentCreateDTO>('/documents', 'Documents')

/**
 * Récupère la liste complète des documents
 * @returns Array de documents
 */
export async function listDocuments(): Promise<DocumentDTO[]> {
  return documentApi.list()
}

// Backward-compatible name
export async function fetchDocuments(): Promise<DocumentDTO[]> {
  return listDocuments()
}

/**
 * Récupère un document par son ID
 * @param id - ID du document
 * @returns Détails du document
 */
export async function getDocument(id: string): Promise<DocumentDTO> {
  return documentApi.getById(id)
}

/**
 * Crée un nouveau document
 * @param data - Données du document à créer
 * @returns Document créé
 */
export async function createDocument(data: DocumentCreateDTO): Promise<DocumentDTO> {
  return documentApi.create(data)
}

// Backward-compatible name
export async function postDocument(data: DocumentCreateDTO): Promise<DocumentDTO> {
  return createDocument(data)
}

/**
 * Supprime un document
 * @param id - ID du document à supprimer
 */
export async function deleteDocument(id: string): Promise<void> {
  return documentApi.delete(id)
}

/**
 * Télécharge un fichier vers Cloudinary et crée un document
 * @param file - Fichier ou Blob à télécharger
 * @param metadata - Métadonnées optionnelles du document
 * @returns Document créé avec URL sécurisée
 */
export async function uploadDocumentAndSave(
  file: File | Blob,
  metadata: Partial<DocumentCreateDTO> = {}
): Promise<DocumentDTO> {
  const uploader = createUploader()
  const result = await uploader.uploadFile(file instanceof File ? file : new File([file], 'upload'))
  const fileUrl = result.secureUrl || result.url
  const doc: DocumentCreateDTO = {
    id: metadata.id || generateId(),
    name: metadata.name || (file instanceof File ? file.name : 'upload'),
    url: fileUrl,
    uploadedAt: new Date().toISOString(),
    ...metadata,
  } as DocumentCreateDTO
  return createDocument(doc)
}
