// Document service for family documents storage - shared between web and mobile
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy, 
  onSnapshot,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject
} from 'firebase/storage';
import { getFirebaseServices } from './firebase';
import { authService } from './authService';
import type { 
  FamilyDocument, 
  CreateDocumentData, 
  UpdateDocumentData,
  DocumentService as IDocumentService
} from '../types/document';
import { 
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES
} from '../types/document';
import type { FamilyMember } from '../types/core';
import type { Unsubscribe } from './firebase';

class DocumentService implements IDocumentService {
  private readonly COLLECTION_NAME = 'family_documents';
  private readonly STORAGE_PATH = 'family-documents';

  private get db() {
    return getFirebaseServices().db;
  }

  private get storage() {
    return getFirebaseServices().storage;
  }

  // Validate file before upload
  private validateFile(file: File): void {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024} MB`);
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type as any)) {
      throw new Error('File type not allowed. Please upload images, PDFs, or Office documents.');
    }
  }

  // Compress image if needed
  private async compressImage(file: File): Promise<File> {
    if (!file.type.startsWith('image/')) {
      return file;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          // Calculate new dimensions (max 1920px)
          let { width, height } = img;
          const maxSize = 1920;
          
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile.size < file.size ? compressedFile : file);
              } else {
                resolve(file);
              }
            },
            file.type,
            0.85 // 85% quality
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  // Upload file to Firebase Storage
  private async uploadFile(file: File, documentId: string): Promise<{ url: string; thumbnailUrl?: string }> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User must be authenticated');

    // Compress image if needed
    const fileToUpload = await this.compressImage(file);
    
    // Create file path
    const timestamp = Date.now();
    const fileName = `${documentId}_${timestamp}_${file.name}`;
    const filePath = `${this.STORAGE_PATH}/${user.uid}/${fileName}`;
    
    // Upload file
    const storageRef = ref(this.storage, filePath);
    const snapshot = await uploadBytes(storageRef, fileToUpload);
    const url = await getDownloadURL(snapshot.ref);
    
    // For images, create thumbnail (use same URL for now)
    let thumbnailUrl: string | undefined;
    if (file.type.startsWith('image/')) {
      thumbnailUrl = url; // In production, you'd create actual thumbnail
    }
    
    return { url, thumbnailUrl };
  }

  // Create a new document
  async createDocument(data: CreateDocumentData): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to upload documents');
    }

    try {
      // Validate file
      this.validateFile(data.file);

      // Create document entry first
      const docData: any = {
        name: data.name,
        description: data.description,
        category: data.category,
        tags: data.tags || [],
        fileName: data.file.name,
        fileSize: data.file.size,
        fileType: data.file.type,
        uploadedBy: user.uid,
        sharedWith: data.sharedWith || ['all'], // Default share with all family
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        fileUrl: '', // Will be updated after upload
      };

      // Create Firestore document
      const docRef = await addDoc(collection(this.db, this.COLLECTION_NAME), docData);
      
      // Upload file to Storage
      const { url, thumbnailUrl } = await this.uploadFile(data.file, docRef.id);
      
      // Update document with file URLs
      await updateDoc(docRef, {
        fileUrl: url,
        thumbnailUrl: thumbnailUrl || null,
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  // Update document metadata
  async updateDocument(id: string, data: UpdateDocumentData): Promise<void> {
    try {
      const updateData: any = {
        updatedAt: serverTimestamp(),
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.sharedWith !== undefined) updateData.sharedWith = data.sharedWith;

      await updateDoc(doc(this.db, this.COLLECTION_NAME, id), updateData);
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  // Delete document
  async deleteDocument(id: string): Promise<void> {
    try {
      // Get document data first
      const docQuery = query(
        collection(this.db, this.COLLECTION_NAME),
        where('__name__', '==', id)
      );
      const docSnapshot = await getDocs(docQuery);
      
      if (!docSnapshot.empty) {
        const docData = docSnapshot.docs[0].data();
        
        // Delete file from Storage if URL exists
        if (docData.fileUrl) {
          try {
            const fileRef = ref(this.storage, docData.fileUrl);
            await deleteObject(fileRef);
          } catch (error) {
            console.error('Error deleting file from storage:', error);
            // Continue with document deletion even if file deletion fails
          }
        }
      }
      
      // Delete Firestore document
      await deleteDoc(doc(this.db, this.COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Subscribe to documents
  subscribeToDocuments(callback: (documents: FamilyDocument[]) => void): Unsubscribe {
    const user = authService.getCurrentUser();
    if (!user) {
      callback([]);
      return () => {
        // Cleanup function for when user is not authenticated
      };
    }

    const q = query(
      collection(this.db, this.COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, async (snapshot) => {
      const documents: FamilyDocument[] = [];
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Filter documents based on sharing settings
        const isSharedWithUser = data.sharedWith.includes('all') || 
                               data.sharedWith.includes(user.uid) ||
                               data.uploadedBy === user.uid;
        
        if (isSharedWithUser) {
          documents.push({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as FamilyDocument);
        }
      }
      
      callback(documents);
    }, (error) => {
      console.error('Error fetching documents:', error);
      callback([]);
    });
  }

  // Get documents by category
  async getDocumentsByCategory(category: string): Promise<FamilyDocument[]> {
    try {
      const q = query(
        collection(this.db, this.COLLECTION_NAME),
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as FamilyDocument));
    } catch (error) {
      console.error('Error fetching documents by category:', error);
      return [];
    }
  }

  // Search documents
  async searchDocuments(searchTerm: string): Promise<FamilyDocument[]> {
    try {
      // For now, we'll fetch all and filter client-side
      // In production, you'd use a search service like Algolia
      const q = query(
        collection(this.db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const allDocs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as FamilyDocument));
      
      // Filter by search term
      const searchLower = searchTerm.toLowerCase();
      return allDocs.filter(doc => 
        doc.name.toLowerCase().includes(searchLower) ||
        doc.description.toLowerCase().includes(searchLower) ||
        doc.category.toLowerCase().includes(searchLower) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }
}

export const documentService = new DocumentService();