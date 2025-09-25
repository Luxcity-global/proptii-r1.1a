// marketing-hub-feature/src/services/dragDropService.ts
import { useCanvasStoreEnhanced } from '../stores/canvasStoreEnhanced';
import { TemplateService } from './templateService';

export interface DragDropHandler {
  handleDragOver: (e: DragEvent) => void;
  handleDragEnter: (e: DragEvent) => void;
  handleDragLeave: (e: DragEvent) => void;
  handleDrop: (e: DragEvent) => void;
}

export interface DropZoneOptions {
  canvas: HTMLCanvasElement | null;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  onDrop?: (type: 'image' | 'template', data: any) => void;
  onError?: (error: string) => void;
}

export class DragDropService {
  private static dropZone: HTMLDivElement | null = null;
  private static isDragging = false;
  private static dragCounter = 0;

  /**
   * Create a drag and drop zone overlay
   */
  static createDropZone(options: DropZoneOptions): DragDropHandler {
    const canvas = useCanvasStoreEnhanced.getState().canvas;
    
    if (!canvas || !canvas.upperCanvasEl) {
      throw new Error('Canvas not available for drag and drop');
    }

    // Create drop zone overlay
    const dropZone = document.createElement('div');
    dropZone.className = 'canvas-drop-zone';
    dropZone.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(59, 130, 246, 0.1);
      border: 2px dashed #3b82f6;
      border-radius: 8px;
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      pointer-events: none;
    `;

    // Add drop zone content
    const dropContent = document.createElement('div');
    dropContent.className = 'drop-zone-content';
    dropContent.innerHTML = `
      <div style="text-align: center; color: #3b82f6;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 16px;">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7,10 12,15 17,10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">Drop files here</h3>
        <p style="margin: 0; font-size: 14px; opacity: 0.8;">Images, templates, or assets</p>
      </div>
    `;

    dropZone.appendChild(dropContent);

    // Insert drop zone into canvas container
    const canvasContainer = canvas.upperCanvasEl.parentElement;
    if (canvasContainer) {
      canvasContainer.style.position = 'relative';
      canvasContainer.appendChild(dropZone);
      this.dropZone = dropZone;
    }

    return {
      handleDragOver: (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
      },

      handleDragEnter: (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        this.dragCounter++;
        if (this.dragCounter === 1) {
          this.isDragging = true;
          this.showDropZone();
          options.onDragEnter?.();
        }
      },

      handleDragLeave: (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        this.dragCounter--;
        if (this.dragCounter === 0) {
          this.isDragging = false;
          this.hideDropZone();
          options.onDragLeave?.();
        }
      },

      handleDrop: async (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        this.dragCounter = 0;
        this.isDragging = false;
        this.hideDropZone();

        const files = Array.from(e.dataTransfer?.files || []);
        const text = e.dataTransfer?.getData('text/plain') || '';
        
        try {
          // Handle file drops
          if (files.length > 0) {
            await this.handleFileDrop(files, options);
          }
          
          // Handle text drops (template IDs, URLs, etc.)
          if (text) {
            await this.handleTextDrop(text, options);
          }
        } catch (error: any) {
          options.onError?.(error.message || 'Failed to process dropped content');
        }
      }
    };
  }

  /**
   * Show the drop zone overlay
   */
  private static showDropZone(): void {
    if (this.dropZone) {
      this.dropZone.style.display = 'flex';
    }
  }

  /**
   * Hide the drop zone overlay
   */
  private static hideDropZone(): void {
    if (this.dropZone) {
      this.dropZone.style.display = 'none';
    }
  }

  /**
   * Handle dropped files
   */
  private static async handleFileDrop(files: File[], options: DropZoneOptions): Promise<void> {
    const canvasStore = useCanvasStoreEnhanced.getState();
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        await this.handleImageFile(file, canvasStore);
        options.onDrop?.('image', { file, url: URL.createObjectURL(file) });
      } else {
        throw new Error(`Unsupported file type: ${file.type}`);
      }
    }
  }

  /**
   * Handle dropped text (template IDs, URLs)
   */
  private static async handleTextDrop(text: string, options: DropZoneOptions): Promise<void> {
    const canvasStore = useCanvasStoreEnhanced.getState();
    
    // Check if it's a template ID (UUID format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (uuidRegex.test(text)) {
      // Load template by ID
      const success = await canvasStore.loadTemplate(text);
      if (success) {
        options.onDrop?.('template', { templateId: text });
      } else {
        throw new Error('Failed to load template');
      }
    } else if (text.startsWith('http')) {
      // Handle image URLs
      const image = await canvasStore.addImageFromUrl(text);
      if (image) {
        options.onDrop?.('image', { url: text, image });
      } else {
        throw new Error('Failed to load image from URL');
      }
    }
  }

  /**
   * Handle image file upload
   */
  private static async handleImageFile(file: File, canvasStore: ReturnType<typeof useCanvasStoreEnhanced.getState>): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const dataURL = e.target?.result as string;
          const image = await canvasStore.addImageFromUrl(dataURL, {
            name: file.name,
            id: `img_${Date.now()}`
          });
          
          if (image) {
            resolve();
          } else {
            reject(new Error('Failed to add image to canvas'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Setup drag and drop for a canvas element
   */
  static setupCanvasDragDrop(canvasElement: HTMLCanvasElement, options: Partial<DropZoneOptions> = {}): DragDropHandler {
    const canvas = useCanvasStoreEnhanced.getState().canvas;
    
    if (!canvas) {
      throw new Error('Canvas not available');
    }

    const handler = this.createDropZone({
      canvas: canvasElement,
      ...options
    });

    // Add event listeners to canvas
    canvasElement.addEventListener('dragover', handler.handleDragOver);
    canvasElement.addEventListener('dragenter', handler.handleDragEnter);
    canvasElement.addEventListener('dragleave', handler.handleDragLeave);
    canvasElement.addEventListener('drop', handler.handleDrop);

    return handler;
  }

  /**
   * Cleanup drag and drop handlers
   */
  static cleanup(): void {
    if (this.dropZone && this.dropZone.parentElement) {
      this.dropZone.parentElement.removeChild(this.dropZone);
      this.dropZone = null;
    }
    this.dragCounter = 0;
    this.isDragging = false;
  }
}

export default DragDropService;

