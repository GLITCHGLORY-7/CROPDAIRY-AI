// CropDiary AI — Mobile-Optimized Plant Photograph Uploader
// Includes client-side EXIF/GPS stripping, file size validation, camera support, and WCAG AA accessibility.

import React, { useRef, useState } from 'react';
import { Camera, Upload, X, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { sanitizeAndProcessImage, ProcessedImageResult, validateImageFile } from '../utils/imageUtils';

interface ImageUploaderProps {
  onImageSelected: (result: ProcessedImageResult | null) => void;
  selectedImage: ProcessedImageResult | null;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  selectedImage,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;

    setErrorMsg(null);
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setErrorMsg(validation.error || 'Invalid image file.');
      return;
    }

    try {
      setIsProcessing(true);
      const processed = await sanitizeAndProcessImage(file);
      onImageSelected(processed);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process image.');
      onImageSelected(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isProcessing) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleClear = () => {
    setErrorMsg(null);
    onImageSelected(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        id="crop-photo-file-input"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Upload crop photograph from device"
        className="sr-only"
        disabled={disabled || isProcessing}
        onChange={(e) => handleFileChange(e.target.files?.[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        id="crop-photo-camera-input"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        aria-label="Take crop photograph with camera"
        className="sr-only"
        disabled={disabled || isProcessing}
        onChange={(e) => handleFileChange(e.target.files?.[0])}
      />

      {/* Selected Image Preview State */}
      {selectedImage ? (
        <div className="relative rounded-2xl border-2 border-agri-600/40 bg-agri-50/20 p-3 sm:p-4 transition-all">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-44 h-44 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex-shrink-0 shadow-sm">
              <img
                src={selectedImage.dataUrl}
                alt="Uploaded affected plant specimen with visible symptoms"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleClear}
                aria-label="Remove selected plant photo"
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors focus:ring-2 focus:ring-red-400 focus:outline-none min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 space-y-2 text-left w-full">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-agri-800 uppercase tracking-wide">
                  Specimen Photo Ready
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>GPS / EXIF Stripped</span>
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <div>Dimensions: <strong>{selectedImage.width} × {selectedImage.height} px</strong></div>
                <div>Optimized Size: <strong>{(selectedImage.sizeBytes / 1024).toFixed(0)} KB</strong> (Original: {(selectedImage.originalSizeBytes / 1024).toFixed(0)} KB)</div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Leaf surface details, spots, and color variations are preserved for diagnostic analysis.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Replace Photo</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Upload Dropzone State */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all ${
            isDragging
              ? 'border-agri-600 bg-agri-50'
              : 'border-slate-300 hover:border-agri-500 bg-slate-50/60'
          }`}
        >
          {isProcessing ? (
            <div className="py-8 space-y-3">
              <RefreshCw className="w-8 h-8 text-agri-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                Stripping GPS/EXIF headers and preparing image...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-agri-100 text-agri-700 flex items-center justify-center shadow-xs">
                <Camera className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Upload or Snap a Clear Photo of the Affected Plant
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Take a close-up picture of the affected leaf, stem, or fruit in natural daylight.
                  JPEG, PNG, or WebP up to 5 MB.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                  className="text-xs gap-2 min-h-[44px]"
                  disabled={disabled}
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Photo</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs gap-2 min-h-[44px]"
                  disabled={disabled}
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose from Gallery</span>
                </Button>
              </div>

              <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Your privacy is protected: EXIF camera & location data are stripped in your browser.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validation Error Banner */}
      {errorMsg && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-medium"
        >
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
