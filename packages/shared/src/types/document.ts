// Document types shared between web and mobile apps
import type { FamilyMember } from './core';

export interface FamilyDocument {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  fileUrl: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedByName?: string;
  sharedWith: FamilyMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentData {
  name: string;
  description: string;
  category: string;
  tags?: string[];
  file: File;
  sharedWith?: FamilyMember[];
}

export interface UpdateDocumentData {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  sharedWith?: FamilyMember[];
}

// Constants
export const DOCUMENT_CATEGORIES = [
  'Médicos',
  'Identificación',
  'Educación',
  'Legal',
  'Financiero',
  'Seguros',
  'Vivienda',
  'Vehículos',
  'Trabajo',
  'Otros'
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
] as const;

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number];
export type AllowedFileType = typeof ALLOWED_FILE_TYPES[number];

// Service layer interface
export interface DocumentService {
  // CRUD operations
  createDocument(data: CreateDocumentData): Promise<string>;
  updateDocument(id: string, data: UpdateDocumentData): Promise<void>;
  deleteDocument(id: string): Promise<void>;
  
  // Query operations
  getDocumentsByCategory(category: string): Promise<FamilyDocument[]>;
  searchDocuments(searchTerm: string): Promise<FamilyDocument[]>;
  
  // Real-time subscriptions
  subscribeToDocuments(callback: (documents: FamilyDocument[]) => void): () => void;
}