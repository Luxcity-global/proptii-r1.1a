import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Save, Download, FileText, Edit3 } from 'lucide-react';
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface DocumentPage {
  id: string;
  content: string;
  pageNumber: number;
  originalContent?: string;
}

interface AdvancedDocumentEditorProps {
  template: {
    id: string;
    name: string;
    file?: File;
    fileUrl: string;
  };
  onSave?: (pages: DocumentPage[]) => void;
  onExport?: (format: 'docx' | 'pdf') => void;
}

const AdvancedDocumentEditor: React.FC<AdvancedDocumentEditorProps> = ({ 
  template, 
  onSave, 
  onExport 
}) => {
  const [pages, setPages] = useState<DocumentPage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fontFamily, setFontFamily] = useState('Times New Roman');
  const [fontSize, setFontSize] = useState(12);
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [editedPages, setEditedPages] = useState<any[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<string>('');

  // Load and convert document on mount
  useEffect(() => {
    loadDocument();
  }, [template]);

  const loadDocument = async () => {
    if (!template) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (template.file?.type === 'application/pdf') {
        await convertPdfToEditable();
      } else if (template.file?.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        await loadDocxDocument();
      } else {
        // Fallback: create a single page with basic content
        setPages([{
          id: '1',
          content: '<p>Document content will be loaded here...</p>',
          pageNumber: 1
        }]);
      }
    } catch (err) {
      setError(`Failed to load document: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const convertPdfToEditable = async () => {
    setIsConverting(true);
    
    try {
      let arrayBuffer: ArrayBuffer;
      
      if (template.file) {
        arrayBuffer = await template.file.arrayBuffer();
      } else {
        const response = await fetch(template.fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.status}`);
        }
        arrayBuffer = await response.arrayBuffer();
      }

      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const convertedPages: DocumentPage[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Convert text content to editable HTML with proper structure
        let pageContent = '<div class="page-content">';
        
        if (textContent.items.length === 0) {
          // If no text content, create a placeholder
          pageContent += '<p>Click here to start editing...</p>';
        } else {
          // Process text items and maintain their structure
          let currentLine = '';
          let lastY = 0;
          
          for (const item of textContent.items) {
            const itemY = (item as any).transform[5];
            const itemText = (item as any).str;
            
            // Add line breaks when Y position changes significantly
            if (Math.abs(itemY - lastY) > 15 && currentLine.trim()) {
              pageContent += `<p>${currentLine.trim()}</p>`;
              currentLine = '';
            }
            
            currentLine += itemText + ' ';
            lastY = itemY;
          }
          
          // Add the last line
          if (currentLine.trim()) {
            pageContent += `<p>${currentLine.trim()}</p>`;
          }
        }
        
        pageContent += '</div>';
        
        convertedPages.push({
          id: `page-${pageNum}`,
          content: pageContent,
          pageNumber: pageNum,
          originalContent: pageContent
        });
      }
      
      setPages(convertedPages);
    } catch (err) {
      throw new Error(`PDF conversion failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsConverting(false);
    }
  };

  const loadDocxDocument = async () => {
    try {
      let arrayBuffer: ArrayBuffer;
      
      if (template.file) {
        arrayBuffer = await template.file.arrayBuffer();
      } else {
        const response = await fetch(template.fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.status}`);
        }
        arrayBuffer = await response.arrayBuffer();
      }

      // For now, create a placeholder for DOCX content
      // In a full implementation, you would use mammoth.js to convert DOCX to HTML
      const docxContent = `
        <div class="page-content">
          <p><strong>DOCX Document Content</strong></p>
          <p>This is a placeholder for the DOCX content. In a full implementation, the DOCX file would be converted to editable HTML using mammoth.js or similar library.</p>
          <p>Click here to start editing the document content...</p>
        </div>
      `;
      
      setPages([{
        id: '1',
        content: docxContent,
        pageNumber: 1,
        originalContent: docxContent
      }]);
    } catch (error) {
      throw new Error(`DOCX loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const updatePageContent = (pageId: string, newContent: string) => {
    // Only update if content actually changed
    setPages(prevPages => 
      prevPages.map(page => 
        page.id === pageId 
          ? page.content !== newContent 
            ? { ...page, content: newContent }
            : page
          : page
      )
    );
  };

  const formatText = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(pages);
    }
  };

  const handleExport = (format: 'docx' | 'pdf') => {
    if (onExport) {
      onExport(format);
    }
  };

  const resetPage = () => {
    const currentPageData = pages[currentPage];
    if (currentPageData?.originalContent) {
      updatePageContent(currentPageData.id, currentPageData.originalContent);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (isConverting) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Converting PDF to editable format...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <FileText size={48} className="mx-auto mb-2" />
            <p className="font-semibold">Error loading document</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <button 
            onClick={loadDocument}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No document loaded</p>
        </div>
      </div>
    );
  }

  const currentPageData = pages[currentPage];

  return (
    <div className="w-full max-w-6xl mx-auto h-full flex flex-col">
      {/* Toolbar */}
      <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex-shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left side - Document controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Page:</span>
              <select 
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {pages.map((page, index) => (
                  <option key={page.id} value={index}>
                    {page.pageNumber}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500">of {pages.length}</span>
            </div>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                isEditing 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-blue-100 text-blue-700 border border-blue-300'
              }`}
            >
              <Edit3 size={16} />
              {isEditing ? 'Editing' : 'Edit Mode'}
            </button>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              <Save size={16} />
              Save
            </button>
            <button
              onClick={() => handleExport('docx')}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              <Download size={16} />
              Export DOCX
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              <Download size={16} />
              Export PDF
            </button>
          </div>
        </div>

        {/* Formatting toolbar - only show when editing */}
        {isEditing && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-2">
            {/* Font Family */}
            <select 
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 py-1 px-3 rounded text-sm"
            >
              <option value="Times New Roman">Times New Roman</option>
              <option value="Arial">Arial</option>
              <option value="Calibri">Calibri</option>
              <option value="Georgia">Georgia</option>
            </select>
            
            {/* Font Size */}
            <div className="inline-flex border border-gray-300 rounded bg-white">
              <button 
                onClick={() => setFontSize(prev => Math.max(prev - 1, 8))}
                className="px-2 py-1 border-r border-gray-300 hover:bg-gray-100"
              >
                <span className="text-sm">−</span>
              </button>
              <span className="px-3 py-1 text-sm">{fontSize}</span>
              <button 
                onClick={() => setFontSize(prev => Math.min(prev + 1, 24))}
                className="px-2 py-1 border-l border-gray-300 hover:bg-gray-100"
              >
                <span className="text-sm">+</span>
              </button>
            </div>
            
            {/* Text Formatting */}
            <button 
              onClick={() => formatText('bold')}
              className="p-1 border border-gray-300 rounded hover:bg-gray-100" 
              title="Bold"
            >
              <Bold size={16} />
            </button>
            <button 
              onClick={() => formatText('italic')}
              className="p-1 border border-gray-300 rounded hover:bg-gray-100" 
              title="Italic"
            >
              <Italic size={16} />
            </button>
            <button 
              onClick={() => formatText('underline')}
              className="p-1 border border-gray-300 rounded hover:bg-gray-100" 
              title="Underline"
            >
              <Underline size={16} />
            </button>
            
            {/* Text Alignment */}
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            <button 
              onClick={() => formatText('justifyLeft')}
              className="p-1 border border-gray-300 rounded hover:bg-gray-100" 
              title="Align Left"
            >
              <AlignLeft size={16} />
            </button>
            <button 
              onClick={() => formatText('justifyCenter')}
              className="p-1 border border-gray-300 rounded hover:bg-gray-100" 
              title="Align Center"
            >
              <AlignCenter size={16} />
            </button>
            <button 
              onClick={() => formatText('justifyRight')}
              className="p-1 border border-gray-300 rounded hover:bg-gray-100" 
              title="Align Right"
            >
              <AlignRight size={16} />
            </button>
            
            {/* Lists */}
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            <button 
              onClick={() => formatText('insertUnorderedList')}
              className="p-1 border border-gray-300 rounded hover:bg-gray-100" 
              title="Bullet List"
            >
              <List size={16} />
            </button>
            <button 
              onClick={() => formatText('insertOrderedList')}
              className="p-1 border border-gray-300 rounded hover:bg-gray-100" 
              title="Numbered List"
            >
              <ListOrdered size={16} />
            </button>

            {/* Reset button */}
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            <button 
              onClick={resetPage}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
            >
              Reset Page
            </button>
          </div>
        )}
      </div>
      
      {/* Scrollable Document Editor Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
          {/* Page Header */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-700">
                Page {currentPageData.pageNumber} of {pages.length}
              </h3>
              <div className="text-sm text-gray-500">
                {template.name}
              </div>
            </div>
          </div>

          {/* Editor Content */}
          <div className="p-4">
            <div 
              ref={editorRef}
              className={`min-h-[200px] max-h-[250px] overflow-y-auto border border-gray-200 rounded p-4 ${
                isEditing ? 'bg-white focus:outline-none focus:ring-2 focus:ring-blue-500' : 'bg-gray-50'
              }`}
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              style={{ 
                fontFamily, 
                fontSize: `${fontSize}px`,
                lineHeight: '1.6'
              }}
              onInput={(e) => {
                if (isEditing && currentPageData) {
                  // Only update content when user stops typing for a moment
                  const newContent = (e.target as HTMLDivElement).innerHTML;
                  clearTimeout((e.target as any)._updateTimeout);
                  (e.target as any)._updateTimeout = setTimeout(() => {
                    updatePageContent(currentPageData.id, newContent);
                  }, 300);
                }
              }}
              onFocus={() => {
                if (!isEditing) {
                  setIsEditing(true);
                }
              }}
              dangerouslySetInnerHTML={{ __html: currentPageData?.content || '' }}
            />
            {!isEditing && (
              <div className="mt-2 text-sm text-gray-500 text-center">
                Click on the text above to start editing
              </div>
            )}
          </div>
        </div>

        {/* Page Navigation */}
        {pages.length > 1 && (
          <div className="mt-4 flex justify-center items-center gap-4 flex-shrink-0">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                currentPage === 0 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              ← Previous
            </button>
            
            <span className="text-sm text-gray-600">
              Page {currentPage + 1} of {pages.length}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(pages.length - 1, prev + 1))}
              disabled={currentPage === pages.length - 1}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                currentPage === pages.length - 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedDocumentEditor; 