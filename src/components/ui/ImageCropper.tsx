'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from './Button';
import { Modal } from './Modal';
import { Upload, X, Loader2 } from 'lucide-react';

interface ImageCropperProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  aspectRatio?: number;
  maxSize?: number;
  className?: string;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  outputSize: number = 256
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Set canvas to desired output size (square)
  canvas.width = outputSize;
  canvas.height = outputSize;

  // Draw the cropped image scaled to fit the canvas
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas is empty'));
        }
      },
      'image/png',
      0.95
    );
  });
}

export function ImageCropper({
  value,
  onChange,
  onRemove,
  aspectRatio = 1,
  className,
}: ImageCropperProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (4MB max)
      if (file.size > 4 * 1024 * 1024) {
        setError('Image must be less than 4MB');
        return;
      }

      setError(null);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
        setIsModalOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    },
    [aspectRatio]
  );

  const handleCropComplete = async () => {
    if (!imgRef.current || !crop) return;

    try {
      setIsUploading(true);
      setError(null);

      // Convert crop to pixels
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const pixelCrop: PixelCrop = {
        unit: 'px',
        x: (crop.x ?? 0) * scaleX * image.width / 100,
        y: (crop.y ?? 0) * scaleY * image.height / 100,
        width: (crop.width ?? 0) * scaleX * image.width / 100,
        height: (crop.height ?? 0) * scaleY * image.height / 100,
      };

      // Get cropped image blob
      const croppedBlob = await getCroppedImg(image, pixelCrop, 256);

      // Upload to server
      const formData = new FormData();
      formData.append('file', croppedBlob, 'logo.png');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const { url } = await response.json();
      onChange(url);
      setIsModalOpen(false);
      setImageSrc(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setImageSrc(null);
    setCrop(undefined);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onSelectFile}
        className="hidden"
        id="image-upload"
      />

      {value ? (
        <div className="flex items-center gap-4">
          <img
            src={value}
            alt="Logo"
            className="h-20 w-20 rounded-lg object-cover border border-gray-200"
          />
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              Change
            </Button>
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" /> Remove
              </Button>
            )}
          </div>
        </div>
      ) : (
        <label
          htmlFor="image-upload"
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
        >
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
          <p className="text-xs text-gray-400">PNG, JPG up to 4MB</p>
        </label>
      )}

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title="Crop Image"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Drag to adjust the crop area. The image will be saved as a square.
          </p>

          {imageSrc && (
            <div className="flex justify-center bg-gray-100 rounded-lg p-4">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                aspect={aspectRatio}
                circularCrop={false}
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  className="max-h-[400px] max-w-full"
                />
              </ReactCrop>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCropComplete}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
