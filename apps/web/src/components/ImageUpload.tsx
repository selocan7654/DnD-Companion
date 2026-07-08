import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import type { PresignRequestInput, UploadPurpose } from '@dnd-companion/shared';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  getUploadMaxDimension,
  isAllowedImageType,
  MAX_UPLOAD_BYTES,
  resizeImage,
} from '@/lib/imageResize';
import { usePresignUploadMutation } from '@/store/api/uploadsApi';

interface ImageUploadProps {
  purpose: UploadPurpose;
  label: string;
  currentUrl?: string | null;
  onUploadComplete: (publicUrl: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  previewAlt?: string;
}

export function ImageUpload({
  purpose,
  label,
  currentUrl,
  onUploadComplete,
  onClear,
  disabled = false,
  previewAlt = 'Uploaded image preview',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [presignUpload] = usePresignUploadMutation();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!isAllowedImageType(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Only PNG, JPEG, and WebP images are allowed',
      });
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      toast({
        title: 'File too large',
        description: 'Images must be 5 MB or smaller',
      });
      return;
    }

    setIsUploading(true);

    try {
      const maxDimension = getUploadMaxDimension(purpose);
      const resized = await resizeImage(file, maxDimension, maxDimension);

      if (resized.size > MAX_UPLOAD_BYTES) {
        toast({
          title: 'File too large',
          description: 'Images must be 5 MB or smaller after resizing',
        });
        return;
      }

      const presignResult = await presignUpload({
        contentType: file.type as PresignRequestInput['contentType'],
        purpose,
        fileName: file.name,
        fileSize: resized.size,
      }).unwrap();

      const uploadResponse = await fetch(presignResult.data.uploadUrl, {
        method: 'PUT',
        body: resized,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image to storage');
      }

      onUploadComplete(presignResult.data.publicUrl);
      toast({ title: 'Image uploaded' });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: getApiErrorMessage(error, 'Failed to upload image'),
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {currentUrl ? (
        <div className="space-y-3">
          <img
            src={currentUrl}
            alt={previewAlt}
            className="max-h-48 w-full rounded-md border object-cover"
            loading="lazy"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={disabled || isUploading}
              onClick={() => inputRef.current?.click()}
              aria-busy={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Uploading...
                </>
              ) : (
                'Replace image'
              )}
            </Button>
            {onClear ? (
              <Button
                type="button"
                variant="ghost"
                disabled={disabled || isUploading}
                onClick={onClear}
                aria-label="Remove image"
              >
                <X className="mr-2 h-4 w-4" aria-hidden="true" />
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-input bg-muted/30 px-4 py-6 text-sm text-muted-foreground transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
          aria-busy={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <ImagePlus className="h-6 w-6" aria-hidden="true" />
              <span>Choose an image</span>
              <span className="text-xs">PNG, JPEG, or WebP up to 5 MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => void handleFileChange(event)}
        disabled={disabled || isUploading}
        aria-label={`${label} file input`}
      />
    </div>
  );
}
