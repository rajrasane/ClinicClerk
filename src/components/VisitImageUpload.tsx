'use client';

import { useState, useRef } from 'react';
import { Camera, X, Upload, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { imageOptimizer, validateImageFile, formatFileSize } from '@/lib/imageOptimization';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface VisitImage {
  url: string;
  filename: string;
  uploaded_at: string;
}

interface VisitImageUploadProps {
  visitId?: number;
  doctorId: string;
  images: VisitImage[];
  onImagesChange: (images: VisitImage[]) => void;
  maxImages?: number;
}

export default function VisitImageUpload({
  visitId,
  doctorId,
  images,
  onImagesChange,
  maxImages = 5
}: VisitImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed per visit`);
      return;
    }

    setUploading(true);
    const newImages: VisitImage[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }

        // Validate file size (max 10MB before compression)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum 10MB allowed.`);
          continue;
        }

        // Validate and compress image using optimized utility
        const validation = validateImageFile(file);
        if (!validation.valid) {
          toast.error(validation.error || 'Invalid image file');
          continue;
        }

        // Use advanced compression with WebP support if available
        const format = imageOptimizer.getOptimalFormat();
        const compressedFile = await imageOptimizer.compressImage(file, {
          targetSizeKB: 350, // Even more aggressive for free tier
          format,
          maxWidth: 1000,
          maxHeight: 1000
        });
        
        console.log(`Compressed ${file.name}: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)}`);

        // Generate unique filename with proper extension
        const timestamp = Date.now();
        const fileExt = format === 'webp' ? 'webp' : 'jpg';
        const fileName = `${doctorId}/${visitId || 'temp'}_${timestamp}.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('visit-images')
          .upload(fileName, compressedFile);

        if (error) {
          console.error('Upload error:', error);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('visit-images')
          .getPublicUrl(fileName);

        newImages.push({
          url: publicUrl,
          filename: file.name,
          uploaded_at: new Date().toISOString()
        });
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        // Only show toast for multiple images or if user prefers feedback
        if (newImages.length > 1) {
          toast.success(`${newImages.length} images uploaded successfully`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = async (index: number) => {
    const imageToRemove = images[index];
    
    try {
      // Extract filename from URL for deletion
      const urlParts = imageToRemove.url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${doctorId}/${fileName}`;

      // Delete from Supabase Storage
      const { error } = await supabase.storage
        .from('visit-images')
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete image from storage');
        return;
      }

      // Remove from local state
      const updatedImages = images.filter((_, i) => i !== index);
      onImagesChange(updatedImages);

      // Update the visit in database immediately
      if (visitId) {
        console.log('🔄 Updating visit images in database...');
        const { error: updateError } = await supabase
          .from('visits')
          .update({ images: updatedImages })
          .eq('id', visitId);

        if (updateError) {
          console.error('Database update error:', updateError);
          toast.error('Image deleted from storage but failed to update visit record');
        } else {
          console.log('✅ Visit images updated in database');
          // Clear cache to force fresh data
          const { apiCache } = await import('@/lib/cache');
          apiCache.invalidate('/api/visits');
          apiCache.invalidate(`/api/visits/${visitId}`);
        }
      }

      toast.success('Image removed');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to remove image');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Visit Images ({images.length}/{maxImages})
        </label>
        
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                Compressing & Uploading...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Add Images
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={image.url}
                  alt={image.filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
              
              {/* Filename tooltip */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                {image.filename}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            No images uploaded yet
          </p>
          <p className="text-xs text-gray-400">
            Click "Add Images" to upload photos for this visit
          </p>
        </div>
      )}
    </div>
  );
}
