// Documents screen for FAMAPP mobile
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { documentService } from '@famapp/shared';
import type { Document } from '@famapp/shared';

export function DocumentsScreen() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const documentsData = await documentService.getDocuments();
      setDocuments(documentsData);
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'No se pudieron cargar los documentos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDocument = async (document: Document) => {
    try {
      if (document.url) {
        const supported = await Linking.canOpenURL(document.url);
        if (supported) {
          await Linking.openURL(document.url);
        } else {
          Alert.alert('Error', 'No se puede abrir este documento');
        }
      } else {
        Alert.alert('Error', 'El documento no tiene una URL válida');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'No se pudo abrir el documento');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toUpperCase() || '';
  };

  const getFileIcon = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📋';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'mp4':
      case 'mov':
      case 'avi':
        return '🎥';
      case 'mp3':
      case 'wav':
        return '🎵';
      case 'zip':
      case 'rar':
        return '📦';
      default:
        return '📎';
    }
  };

  const renderDocument = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.documentItem}
      onPress={() => handleOpenDocument(item)}
    >
      <View style={styles.documentIcon}>
        <Text style={styles.iconText}>{getFileIcon(item.name)}</Text>
      </View>
      
      <View style={styles.documentContent}>
        <Text style={styles.documentName} numberOfLines={2}>
          {item.name}
        </Text>
        
        <View style={styles.documentDetails}>
          <Text style={styles.documentMeta}>
            {getFileExtension(item.name)}
            {item.size && ` • ${formatFileSize(item.size)}`}
          </Text>
          <Text style={styles.documentMeta}>
            Subido por: {item.uploadedBy}
          </Text>
          <Text style={styles.documentDate}>
            {item.createdAt.toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
            )}
          </View>
        )}
      </View>
      
      <View style={styles.actionButton}>
        <Text style={styles.actionButtonText}>Ver</Text>
      </View>
    </TouchableOpacity>
  );

  // Group documents by category if available
  const groupedDocuments = documents.reduce((groups, doc) => {
    const key = doc.category || 'Sin categoría';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(doc);
    return groups;
  }, {} as Record<string, Document[]>);

  const sections = Object.entries(groupedDocuments).map(([category, docs]) => ({
    title: category,
    data: docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  }));

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text>Cargando documentos...</Text>
      </View>
    );
  }

  if (documents.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No hay documentos</Text>
        <Text style={styles.emptySubtext}>
          Los documentos subidos aparecerán aquí
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {sections.map(section => (
        <View key={section.title}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>({section.data.length})</Text>
          </View>
          <FlatList
            data={section.data}
            renderItem={renderDocument}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  sectionCount: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  documentContent: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  documentDetails: {
    marginBottom: 8,
  },
  documentMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#dbeafe',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 2,
  },
  tagText: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 10,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});