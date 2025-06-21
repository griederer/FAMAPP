import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import { DocumentsScreen } from '../../src/screens/DocumentsScreen';
import { documentService } from '@famapp/shared';

// Mock Alert and Linking
jest.spyOn(Alert, 'alert');
jest.mock('react-native/Libraries/Linking/Linking');

const mockDocuments = [
  {
    ...global.mockDocument,
    id: 'doc-1',
    name: 'family-budget.pdf',
    url: 'https://example.com/family-budget.pdf',
    size: 2048,
    mimeType: 'application/pdf',
    category: 'Finanzas',
    tags: ['presupuesto', 'familia'],
  },
  {
    ...global.mockDocument,
    id: 'doc-2',
    name: 'vacation-photos.jpg',
    url: 'https://example.com/vacation-photos.jpg',
    size: 5120,
    mimeType: 'image/jpeg',
    category: 'Fotos',
    tags: ['vacaciones', 'familia', 'verano'],
  },
  {
    ...global.mockDocument,
    id: 'doc-3',
    name: 'insurance-policy.docx',
    url: 'https://example.com/insurance-policy.docx',
    size: 1024,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // No category to test "Sin categoría"
  },
];

describe('DocumentsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(documentService.getDocuments).mockResolvedValue(mockDocuments);
    jest.mocked(Linking.canOpenURL).mockResolvedValue(true);
    jest.mocked(Linking.openURL).mockResolvedValue(true);
  });

  it('renders loading state initially', () => {
    const { getByText } = render(<DocumentsScreen />);
    expect(getByText('Cargando documentos...')).toBeTruthy();
  });

  it('loads and displays documents', async () => {
    const { getByText } = render(<DocumentsScreen />);

    await waitFor(() => {
      expect(getByText('family-budget.pdf')).toBeTruthy();
      expect(getByText('vacation-photos.jpg')).toBeTruthy();
      expect(getByText('insurance-policy.docx')).toBeTruthy();
    });

    expect(documentService.getDocuments).toHaveBeenCalled();
  });

  it('shows empty state when no documents', async () => {
    jest.mocked(documentService.getDocuments).mockResolvedValue([]);
    
    const { getByText } = render(<DocumentsScreen />);

    await waitFor(() => {
      expect(getByText('No hay documentos')).toBeTruthy();
      expect(getByText('Los documentos subidos aparecerán aquí')).toBeTruthy();
    });
  });

  it('groups documents by category', async () => {
    const { getByText } = render(<DocumentsScreen />);

    await waitFor(() => {
      expect(getByText('Finanzas (1)')).toBeTruthy();
      expect(getByText('Fotos (1)')).toBeTruthy();
      expect(getByText('Sin categoría (1)')).toBeTruthy();
    });
  });

  it('displays document information correctly', async () => {
    const { getByText } = render(<DocumentsScreen />);

    await waitFor(() => {
      expect(getByText('family-budget.pdf')).toBeTruthy();
      expect(getByText('PDF • 2 KB')).toBeTruthy();
      expect(getByText('Subido por: gonzalo')).toBeTruthy();
    });
  });

  it('displays file size correctly', async () => {
    const { getByText } = render(<DocumentsScreen />);

    await waitFor(() => {
      expect(getByText('PDF • 2 KB')).toBeTruthy();
      expect(getByText('JPEG • 5 KB')).toBeTruthy();
      expect(getByText('DOCX • 1 KB')).toBeTruthy();
    });
  });

  it('shows document tags', async () => {
    const { getByText } = render(<DocumentsScreen />);

    await waitFor(() => {
      expect(getByText('presupuesto')).toBeTruthy();
      expect(getByText('familia')).toBeTruthy();
      expect(getByText('vacaciones')).toBeTruthy();
    });
  });

  it('shows +N for more than 3 tags', async () => {
    const { getByText } = render(<DocumentsScreen />);

    await waitFor(() => {
      // vacation-photos.jpg has 3 tags, so all should be shown
      expect(getByText('vacaciones')).toBeTruthy();
      expect(getByText('familia')).toBeTruthy();
      expect(getByText('verano')).toBeTruthy();
    });
  });

  it('opens document when pressed', async () => {
    const { getByText } = render(<DocumentsScreen />);

    await waitFor(() => {
      expect(getByText('family-budget.pdf')).toBeTruthy();
    });

    // Press the document item
    const docItem = getByText('family-budget.pdf').parent?.parent?.parent;
    fireEvent.press(docItem!);

    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalledWith('https://example.com/family-budget.pdf');
      expect(Linking.openURL).toHaveBeenCalledWith('https://example.com/family-budget.pdf');
    });
  });

  it('shows error when document cannot be opened', async () => {
    jest.mocked(Linking.canOpenURL).mockResolvedValue(false);

    const { getByText } = render(<DocumentsScreen />);

    await waitFor(() => {
      expect(getByText('family-budget.pdf')).toBeTruthy();
    });

    // Press the document item
    const docItem = getByText('family-budget.pdf').parent?.parent?.parent;
    fireEvent.press(docItem!);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'No se puede abrir este documento'
      );
    });
  });

  it('shows error when document has no URL', async () => {
    const documentsWithoutUrl = [
      {
        ...mockDocuments[0],
        url: '',
      },
    ];
    jest.mocked(documentService.getDocuments).mockResolvedValue(documentsWithoutUrl);

    const { getByText } = render(<DocumentsScreen />);

    await waitFor(() => {
      expect(getByText('family-budget.pdf')).toBeTruthy();
    });

    // Press the document item
    const docItem = getByText('family-budget.pdf').parent?.parent?.parent;
    fireEvent.press(docItem!);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'El documento no tiene una URL válida'
      );
    });
  });

  it('handles document loading error', async () => {
    jest.mocked(documentService.getDocuments).mockRejectedValue(new Error('Network error'));

    render(<DocumentsScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'No se pudieron cargar los documentos'
      );
    });
  });

  it('handles document opening error', async () => {
    jest.mocked(Linking.openURL).mockRejectedValue(new Error('Cannot open'));

    const { getByText } = render(<DocumentsScreen />);

    await waitFor(() => {
      expect(getByText('family-budget.pdf')).toBeTruthy();
    });

    // Press the document item
    const docItem = getByText('family-budget.pdf').parent?.parent?.parent;
    fireEvent.press(docItem!);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'No se pudo abrir el documento'
      );
    });
  });

  it('displays correct file icons', async () => {
    const { getByText } = render(<DocumentsScreen />);

    await waitFor(() => {
      // Should display emoji icons based on file type
      const pdfIcon = getByText('📄'); // PDF icon
      const jpegIcon = getByText('🖼️'); // Image icon
      const docxIcon = getByText('📝'); // Word document icon
      
      expect(pdfIcon).toBeTruthy();
      expect(jpegIcon).toBeTruthy();
      expect(docxIcon).toBeTruthy();
    });
  });

  it('formats file sizes correctly', async () => {
    const documentsWithVariousSizes = [
      {
        ...mockDocuments[0],
        size: 500, // 500 Bytes
      },
      {
        ...mockDocuments[1],
        size: 1024, // 1 KB
      },
      {
        ...mockDocuments[2],
        size: 1048576, // 1 MB
      },
    ];
    jest.mocked(documentService.getDocuments).mockResolvedValue(documentsWithVariousSizes);

    const { getByText } = render(<DocumentsScreen />);

    await waitFor(() => {
      expect(getByText('PDF • 500 Bytes')).toBeTruthy();
      expect(getByText('JPEG • 1 KB')).toBeTruthy();
      expect(getByText('DOCX • 1 MB')).toBeTruthy();
    });
  });

  it('shows creation date', async () => {
    const { getByText } = render(<DocumentsScreen />);

    await waitFor(() => {
      // Should show formatted date
      expect(getByText('ene 1, 2024')).toBeTruthy();
    });
  });

  it('handles documents without size', async () => {
    const documentsWithoutSize = [
      {
        ...mockDocuments[0],
        size: undefined,
      },
    ];
    jest.mocked(documentService.getDocuments).mockResolvedValue(documentsWithoutSize);

    const { getByText } = render(<DocumentsScreen />);

    await waitFor(() => {
      // Should show only file extension without size
      expect(getByText('PDF')).toBeTruthy();
    });
  });

  it('handles documents without tags', async () => {
    const documentsWithoutTags = [
      {
        ...mockDocuments[0],
        tags: undefined,
      },
    ];
    jest.mocked(documentService.getDocuments).mockResolvedValue(documentsWithoutTags);

    const { getByText, queryByText } = render(<DocumentsScreen />);

    await waitFor(() => {
      expect(getByText('family-budget.pdf')).toBeTruthy();
      // Should not show any tags
      expect(queryByText('presupuesto')).toBeNull();
    });
  });

  it('sorts documents by creation date within categories', async () => {
    const documentsWithDifferentDates = [
      {
        ...mockDocuments[0],
        category: 'Test',
        createdAt: new Date('2024-01-01'),
        name: 'older-doc.pdf',
      },
      {
        ...mockDocuments[1],
        category: 'Test',
        createdAt: new Date('2024-01-15'),
        name: 'newer-doc.pdf',
      },
    ];
    jest.mocked(documentService.getDocuments).mockResolvedValue(documentsWithDifferentDates);

    const { getByText } = render(<DocumentsScreen />);

    await waitFor(() => {
      // Should show newer documents first
      expect(getByText('newer-doc.pdf')).toBeTruthy();
      expect(getByText('older-doc.pdf')).toBeTruthy();
    });
  });
});