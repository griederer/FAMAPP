// Documents module for family document storage
import { useState, useEffect, useMemo, useRef } from 'react';
import { documentService, DOCUMENT_CATEGORIES } from '@famapp/shared';
import type { FamilyDocument, CreateDocumentData } from '@famapp/shared';

export function DocumentsModule() {
  const [documents, setDocuments] = useState<FamilyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [storageEnabled, setStorageEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for new document
  const [newDocument, setNewDocument] = useState<Partial<CreateDocumentData>>({
    name: '',
    description: '',
    category: '',
    tags: [],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Subscribe to documents
  useEffect(() => {
    setLoading(true);
    const unsubscribe = documentService.subscribeToDocuments((docs) => {
      setDocuments(docs);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, []);

  // Check if Firebase Storage is enabled
  useEffect(() => {
    const checkStorageEnabled = async () => {
      try {
        // Try a simple storage operation to test if it's enabled
        const { storage } = await import('../../config/firebase');
        const { ref } = await import('firebase/storage');
        
        // Try to create a reference - this will fail if Storage isn't enabled
        const testRef = ref(storage, 'test');
        if (testRef) {
          setStorageEnabled(true);
        }
      } catch (err) {
        console.log('Firebase Storage not enabled:', err);
        setStorageEnabled(false);
      }
    };

    // Always assume storage is not enabled until proven otherwise
    setStorageEnabled(false);
    checkStorageEnabled();
  }, []);

  // Filter documents based on category and search
  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(query) ||
        doc.description.toLowerCase().includes(query) ||
        doc.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [documents, selectedCategory, searchQuery]);

  // Group documents by category
  const documentsByCategory = useMemo(() => {
    const grouped: { [key: string]: FamilyDocument[] } = {};
    
    filteredDocuments.forEach(doc => {
      if (!grouped[doc.category]) {
        grouped[doc.category] = [];
      }
      grouped[doc.category].push(doc);
    });
    
    return grouped;
  }, [filteredDocuments]);


  // Handle file selection
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    // Auto-fill name from filename if empty
    if (!newDocument.name) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setNewDocument(prev => ({ ...prev, name: nameWithoutExt }));
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle document upload
  const handleUpload = async () => {
    if (!selectedFile || !newDocument.name || !newDocument.category) {
      setError('Please fill in all required fields');
      return;
    }

    if (!storageEnabled) {
      setError('Firebase Storage needs to be enabled. Please follow the setup instructions above.');
      return;
    }

    try {
      setUploadProgress(0);
      const data: CreateDocumentData = {
        name: newDocument.name,
        description: newDocument.description || '',
        category: newDocument.category,
        tags: newDocument.tags || [],
        file: selectedFile,
      };

      await documentService.createDocument(data);
      
      // Show success and close modal after a brief delay
      setUploadProgress(100);
      
      setTimeout(() => {
        // Reset form
        setNewDocument({
          name: '',
          description: '',
          category: '',
          tags: [],
        });
        setSelectedFile(null);
        setShowUploadModal(false);
        setUploadProgress(0);
        setError(null); // Clear any previous errors
      }, 500); // Small delay to show completion
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
      console.error('Error uploading document:', err);
    }
  };

  // Handle document deletion
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentService.deleteDocument(id);
    } catch (err) {
      setError('Failed to delete document');
      console.error('Error deleting document:', err);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Get file icon based on type
  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}></div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      
      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{
        marginBottom: '32px',
        paddingTop: '32px',
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#1f2937',
          margin: '0 0 8px 0',
        }}>
          Family Documents
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          margin: '0',
        }}>
          Store and organize important family documents securely
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          backgroundColor: '#dbeafe',
          borderRadius: '12px',
          padding: '16px',
          border: '2px solid #93c5fd',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>📚</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e40af' }}>
            {documents.length}
          </div>
          <div style={{ fontSize: '14px', color: '#3730a3' }}>
            Total Documents
          </div>
        </div>


      </div>

      {/* Storage Setup Notice - only show if storage is not enabled */}
      {!storageEnabled && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '2px solid #fde68a',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#92400e',
            margin: '0 0 8px 0',
          }}>
            🔧 Firebase Storage Setup Required
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#b45309',
            margin: '0 0 12px 0',
            lineHeight: '1.5',
          }}>
            To upload documents, Firebase Storage needs to be enabled in the Firebase Console:
          </p>
          <ol style={{
            fontSize: '14px',
            color: '#b45309',
            margin: '0 0 12px 20px',
            paddingLeft: '0',
          }}>
            <li>Go to <a href="https://console.firebase.google.com/project/famapp-e80ff/storage" target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8', textDecoration: 'underline' }}>Firebase Storage Console</a></li>
            <li>Click "Get Started"</li>
            <li>Choose "Start in production mode"</li>
            <li>Select a location (choose closest to your users)</li>
            <li>Click "Done"</li>
          </ol>
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#f59e0b',
            color: 'white',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            textAlign: 'center',
          }}>
            ⚠️ IMPORTANT: Storage must be enabled in Firebase Console first!
          </div>
          <p style={{
            fontSize: '12px',
            color: '#92400e',
            margin: '8px 0 0 0',
            fontStyle: 'italic',
            textAlign: 'center',
          }}>
            Once enabled, refresh the page and document uploads will work normally.
          </p>
        </div>
      )}

      {/* Actions Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={() => setShowUploadModal(true)}
          style={{
            backgroundColor: storageEnabled ? '#3b82f6' : '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: storageEnabled ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: storageEnabled ? 1 : 0.6,
          }}
          disabled={!storageEnabled}
        >
          <span style={{ fontSize: '20px' }}>📤</span>
          {storageEnabled ? 'Upload Document' : 'Upload Document (Setup Required)'}
        </button>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Search documents..."
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '10px 16px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '16px',
            backgroundColor: 'white',
          }}
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '10px 16px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '16px',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          <option value="all">All Categories</option>
          {DOCUMENT_CATEGORIES.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>


      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '300px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '2px dashed #e5e7eb',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
          <h3 style={{ fontSize: '18px', margin: '0 0 8px 0', color: '#6b7280' }}>
            {searchQuery || selectedCategory !== 'all' 
              ? 'No documents found'
              : 'No documents yet'}
          </h3>
          <p style={{ fontSize: '14px', margin: '0', color: '#9ca3af' }}>
            {searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Upload your first document to get started'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '24px',
        }}>
          {Object.entries(documentsByCategory).map(([category, docs]) => (
            <div key={category}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#374151',
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                {category}
                <span style={{
                  fontSize: '14px',
                  fontWeight: '400',
                  color: '#6b7280',
                }}>
                  ({docs.length})
                </span>
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px',
              }}>
                {docs.map(doc => (
                  <div
                    key={doc.id}
                    style={{
                      backgroundColor: 'white',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '16px',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '12px',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flex: 1,
                      }}>
                        <span style={{ fontSize: '32px' }}>
                          {getFileIcon(doc.fileType)}
                        </span>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#1f2937',
                            margin: '0 0 4px 0',
                          }}>
                            {doc.name}
                          </h3>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          fontSize: '20px',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title="Delete document"
                      >
                        ×
                      </button>
                    </div>

                    {doc.description && (
                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        margin: '0 0 12px 0',
                        lineHeight: '1.5',
                      }}>
                        {doc.description}
                      </p>
                    )}

                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap',
                      marginBottom: '12px',
                    }}>
                      {doc.tags.map(tag => (
                        <span
                          key={tag}
                          style={{
                            fontSize: '12px',
                            color: '#3b82f6',
                            backgroundColor: '#dbeafe',
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      color: '#9ca3af',
                    }}>
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>Uploaded {doc.createdAt.toLocaleDateString()}</span>
                    </div>


                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <a
                        href={doc.fileUrl}
                        download={doc.fileName}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          textDecoration: 'none',
                          textAlign: 'center',
                          flex: 1,
                        }}
                      >
                        📥 Download
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(doc.fileUrl, '_blank');
                        }}
                        style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          flex: 1,
                        }}
                      >
                        👁️ View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 40,
            }}
            onClick={() => setShowUploadModal(false)}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            zIndex: 50,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '20px',
            }}>
              Upload Document
            </h2>

            {/* File Upload Area */}
            <div
              style={{
                border: '2px dashed',
                borderColor: dragActive ? '#3b82f6' : '#e5e7eb',
                borderRadius: '12px',
                padding: '32px',
                textAlign: 'center',
                backgroundColor: dragActive ? '#eff6ff' : '#f9fafb',
                marginBottom: '20px',
                transition: 'all 0.2s',
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                style={{ display: 'none' }}
              />
              
              {selectedFile ? (
                <div>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                    {getFileIcon(selectedFile.type)}
                  </div>
                  <p style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#1f2937',
                    margin: '0 0 4px 0',
                  }}>
                    {selectedFile.name}
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: '0 0 12px 0',
                  }}>
                    {formatFileSize(selectedFile.size)}
                  </p>
                  <button
                    onClick={() => setSelectedFile(null)}
                    style={{
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📤</div>
                  <p style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#1f2937',
                    margin: '0 0 8px 0',
                  }}>
                    Drag and drop your file here, or
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    Browse Files
                  </button>
                  <p style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    margin: '12px 0 0 0',
                  }}>
                    Supported: Images, PDFs, Word, Excel (Max 10MB)
                  </p>
                </div>
              )}
            </div>

            {/* Document Details Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '4px',
                }}>
                  Document Name *
                </label>
                <input
                  type="text"
                  value={newDocument.name || ''}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Passport - John Doe"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '4px',
                }}>
                  Description
                </label>
                <textarea
                  value={newDocument.description || ''}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add any relevant details about this document..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '4px',
                }}>
                  Category *
                </label>
                <select
                  value={newDocument.category || ''}
                  onChange={(e) => setNewDocument(prev => ({ 
                    ...prev, 
                    category: e.target.value,
                  }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Select category</option>
                  {DOCUMENT_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>


              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '4px',
                }}>
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newDocument.tags?.join(', ') || ''}
                  onChange={(e) => setNewDocument(prev => ({ 
                    ...prev, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                  }))}
                  placeholder="e.g., important, 2024, renewal"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  height: '8px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    backgroundColor: uploadProgress === 100 ? '#10b981' : '#3b82f6',
                    height: '100%',
                    width: `${uploadProgress}%`,
                    transition: 'width 0.3s',
                  }} />
                </div>
                <p style={{
                  fontSize: '12px',
                  color: uploadProgress === 100 ? '#10b981' : '#6b7280',
                  marginTop: '4px',
                  textAlign: 'center',
                  fontWeight: uploadProgress === 100 ? '600' : '400',
                }}>
                  {uploadProgress === 100 ? '✅ Upload successful! Closing...' : `Uploading... ${uploadProgress}%`}
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '24px',
            }}>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setNewDocument({
                    name: '',
                    description: '',
                    category: '',
                    tags: [],
                  });
                  setSelectedFile(null);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || !newDocument.name || !newDocument.category}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedFile && newDocument.name && newDocument.category ? '#3b82f6' : '#e5e7eb',
                  color: selectedFile && newDocument.name && newDocument.category ? 'white' : '#9ca3af',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: selectedFile && newDocument.name && newDocument.category ? 'pointer' : 'not-allowed',
                }}
              >
                Upload Document
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}