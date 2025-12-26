'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from './Button';
import { Modal } from './Modal';
import { Upload, X, Loader2, Crop as CropIcon, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';

type FitMode = 'crop' | 'fit';
type BackgroundColor = 'transparent' | 'white' | 'black' | 'auto';

interface ImageCropperProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  aspectRatio?: number;
  outputSize?: number;
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

// Get cropped image (crop mode)
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

  canvas.width = outputSize;
  canvas.height = outputSize;

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

// Fit image to square with padding (fit mode)
async function getFittedImg(
  image: HTMLImageElement,
  backgroundColor: BackgroundColor,
  outputSize: number = 256
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  canvas.width = outputSize;
  canvas.height = outputSize;

  // Fill background
  if (backgroundColor === 'white') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputSize, outputSize);
  } else if (backgroundColor === 'black') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, outputSize, outputSize);
  } else if (backgroundColor === 'auto') {
    // Sample corner pixels for average color
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCanvas.width = image.naturalWidth;
      tempCanvas.height = image.naturalHeight;
      tempCtx.drawImage(image, 0, 0);
      
      const corners = [
        tempCtx.getImageData(0, 0, 1, 1).data,
        tempCtx.getImageData(image.naturalWidth - 1, 0, 1, 1).data,
        tempCtx.getImageData(0, image.naturalHeight - 1, 1, 1).data,
        tempCtx.getImageData(image.naturalWidth - 1, image.naturalHeight - 1, 1, 1).data,
      ];
      
      const avgR = Math.round(corners.reduce((sum, c) => sum + (c[0] ?? 0), 0) / 4);
      const avgG = Math.round(corners.reduce((sum, c) => sum + (c[1] ?? 0), 0) / 4);
      const avgB = Math.round(corners.reduce((sum, c) => sum + (c[2] ?? 0), 0) / 4);
      
      ctx.fillStyle = `rgb(${avgR}, ${avgG}, ${avgB})`;
      ctx.fillRect(0, 0, outputSize, outputSize);
    }
  }
  // transparent = no fill, just leave canvas transparent

  // Calculate scaled dimensions to fit within square
  const imgWidth = image.naturalWidth;
  const imgHeight = image.naturalHeight;
  const scale = Math.min(outputSize / imgWidth, outputSize / imgHeight);
  const scaledWidth = imgWidth * scale;
  const scaledHeight = imgHeight * scale;

  // Center the image
  const x = (outputSize - scaledWidth) / 2;
  const y = (outputSize - scaledHeight) / 2;

  ctx.drawImage(image, 0, 0, imgWidth, imgHeight, x, y, scaledWidth, scaledHeight);

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
  outputSize = 256,
  className,
}: ImageCropperProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<FitMode>('crop');
  const [bgColor, setBgColor] = useState<BackgroundColor>('white');
  const [fitPreview, setFitPreview] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 4 * 1024 * 1024) {
        setError('Image must be less than 4MB');
        return;
      }

      setError(null);
      setMode('crop');
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
      updateFitPreview();
    },
    [aspectRatio]
  );

  const updateFitPreview = useCallback(async () => {
    if (!imgRef.current) return;
    try {
      const blob = await getFittedImg(imgRef.current, bgColor, outputSize);
      const url = URL.createObjectURL(blob);
      setFitPreview(url);
    } catch {
      // Ignore preview errors
    }
  }, [bgColor, outputSize]);

  // Update fit preview when background color changes
  const handleBgColorChange = (color: BackgroundColor) => {
    setBgColor(color);
    if (imgRef.current) {
      getFittedImg(imgRef.current, color, outputSize).then(blob => {
        const url = URL.createObjectURL(blob);
        setFitPreview(url);
      }).catch(() => {});
    }
  };

  const handleSave = async () => {
    if (!imgRef.current) return;

    try {
      setIsUploading(true);
      setError(null);

      let blob: Blob;

      if (mode === 'fit') {
        // Fit mode - scale to fit with padding
        blob = await getFittedImg(imgRef.current, bgColor, outputSize);
      } else {
        // Crop mode
        if (!crop) return;
        
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

        blob = await getCroppedImg(image, pixelCrop, outputSize);
      }

      // Upload to server
      const formData = new FormData();
      formData.append('file', blob, 'logo.png');

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
      handleCancel();
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
    setFitPreview(null);
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
        title="Adjust Logo"
        size="lg"
      >
        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('crop')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                mode === 'crop'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <CropIcon className="h-4 w-4" />
              Crop
            </button>
            <button
              type="button"
              onClick={() => { setMode('fit'); updateFitPreview(); }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                mode === 'fit'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Maximize className="h-4 w-4" />
              Fit
            </button>
          </div>

          <p className="text-sm text-gray-600">
            {mode === 'crop' 
              ? 'Drag to adjust the crop area. Part of the image will be trimmed.'
              : 'The entire logo will be scaled to fit within a square.'}
          </p>

          {imageSrc && mode === 'crop' && (
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

          {imageSrc && mode === 'fit' && (
            <>
              {/* Background color options */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Background:</span>
                <div className="flex gap-2">
                  {(['white', 'transparent', 'black', 'auto'] as BackgroundColor[]).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleBgColorChange(color)}
                      className={cn(
                        'w-8 h-8 rounded-md border-2 transition-all',
                        bgColor === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300',
                        color === 'white' && 'bg-white',
                        color === 'black' && 'bg-black',
                        color === 'transparent' && 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%228%22%20height%3D%228%22%3E%3Crect%20width%3D%224%22%20height%3D%224%22%20fill%3D%22%23ccc%22%2F%3E%3Crect%20x%3D%224%22%20y%3D%224%22%20width%3D%224%22%20height%3D%224%22%20fill%3D%22%23ccc%22%2F%3E%3C%2Fsvg%3E")]',
                        color === 'auto' && 'bg-gradient-to-br from-gray-200 to-gray-400'
                      )}
                      title={color === 'auto' ? 'Auto (sample from image)' : color}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500 capitalize">{bgColor === 'auto' ? 'Auto-detect' : bgColor}</span>
              </div>

              {/* Fit preview */}
              <div className="flex justify-center bg-gray-100 rounded-lg p-4">
                <div className="relative">
                  {/* Hidden image for ref */}
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Source"
                    onLoad={onImageLoad}
                    className="hidden"
                  />
                  {/* Preview */}
                  {fitPreview ? (
                    <img
                      src={fitPreview}
                      alt="Fit preview"
                      className="w-64 h-64 rounded-lg border border-gray-300"
                    />
                  ) : (
                    <div className="w-64 h-64 rounded-lg border border-gray-300 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
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
