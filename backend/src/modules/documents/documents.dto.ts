import { Document } from './documents.model';

export function toDocumentDTO(doc: Document) {
  return {
    id: doc.id,
    communityId: doc.communityId,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    fileUrl: doc.fileUrl,
    fileName: doc.fileName,
    fileSizeBytes: doc.fileSizeBytes,
    visibility: doc.visibility,
    uploader: doc.uploader ? { id: doc.uploader.id, firstName: doc.uploader.firstName, lastName: doc.uploader.lastName } : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function toDocumentListDTO(docs: Document[]) {
  return docs.map(toDocumentDTO);
}
