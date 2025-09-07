// Advanced image optimization utilities for free tier efficiency

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  targetSizeKB?: number;
  format?: 'jpeg' | 'webp';
}

export class ImageOptimizer {
  private static instance: ImageOptimizer;
  private compressionCache = new Map<string, File>();

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  // Generate thumbnail for grid display (saves bandwidth)
  async generateThumbnail(file: File, size: number = 150): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        canvas.width = size;
        canvas.height = size;
        
        // Calculate crop dimensions for square thumbnail
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  // Progressive compression with intelligent quality adjustment
  async compressImage(file: File, options: ImageOptimizationOptions = {}): Promise<File> {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      targetSizeKB = 400,
      format = 'jpeg'
    } = options;

    // Check cache first
    const cacheKey = `${file.name}_${file.size}_${targetSizeKB}`;
    if (this.compressionCache.has(cacheKey)) {
      return this.compressionCache.get(cacheKey)!;
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        
        // Smart dimension reduction based on original size
        if (width > 3000 || height > 3000) {
          // Very large images - aggressive reduction
          const scale = Math.min(800 / width, 800 / height);
          width *= scale;
          height *= scale;
        } else if (width > maxWidth || height > maxHeight) {
          // Standard reduction
          const scale = Math.min(maxWidth / width, maxHeight / height);
          width *= scale;
          height *= scale;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Use high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Progressive quality reduction with intelligent steps
        const tryCompress = (quality: number, attempt: number = 1) => {
          const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
          
          canvas.toBlob((blob) => {
            if (blob) {
              const sizeKB = blob.size / 1024;
              
              if (sizeKB <= targetSizeKB || quality <= 0.2 || attempt > 8) {
                const compressedFile = new File([blob], file.name || 'compressed-image.jpg', {
                  type: mimeType,
                  lastModified: Date.now()
                });
                
                // Cache the result
                this.compressionCache.set(cacheKey, compressedFile);
                
                // Limit cache size
                if (this.compressionCache.size > 50) {
                  const firstKey = this.compressionCache.keys().next().value;
                  if (firstKey) {
                    this.compressionCache.delete(firstKey);
                  }
                }
                
                resolve(compressedFile);
              } else {
                // Intelligent quality reduction based on how far we are from target
                const reduction = sizeKB > targetSizeKB * 2 ? 0.15 : 0.08;
                tryCompress(Math.max(0.2, quality - reduction), attempt + 1);
              }
            } else {
              resolve(file);
            }
          }, mimeType, quality);
        };
        
        tryCompress(0.85);
      };
      
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }

  // Batch process multiple images with progress tracking
  async batchCompress(
    files: File[], 
    options: ImageOptimizationOptions = {},
    onProgress?: (completed: number, total: number) => void
  ): Promise<File[]> {
    const results: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const compressed = await this.compressImage(files[i], options);
      results.push(compressed);
      onProgress?.(i + 1, files.length);
    }
    
    return results;
  }

  // Check if WebP is supported for better compression
  supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // Get optimal format based on browser support
  getOptimalFormat(): 'jpeg' | 'webp' {
    return this.supportsWebP() ? 'webp' : 'jpeg';
  }

  // Clear compression cache
  clearCache(): void {
    this.compressionCache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.compressionCache.size,
      keys: Array.from(this.compressionCache.keys())
    };
  }
}

// Utility functions
export const imageOptimizer = ImageOptimizer.getInstance();

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }
  
  if (file.size > 20 * 1024 * 1024) { // 20MB limit
    return { valid: false, error: 'Image too large (max 20MB)' };
  }
  
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Unsupported image format' };
  }
  
  return { valid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
