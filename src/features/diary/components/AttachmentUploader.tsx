// CropDiary AI — Diary Attachment Uploader Component
// Client-side validated media upload supporting field photos and financial receipts.

import React, { useRef, useState } from 'react';
import { DiaryAttachment } from '@/types/diary';
import { Camera, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AttachmentUploaderProps {
  attachments: DiaryAttachment[];
  onChange: (attachments: DiaryAttachment[]) => void;
  disabled?: boolean;
}

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  attachments,
  onChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMessage(null);
    const newAttachments: DiaryAttachment[] = [...attachments];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!ALLOWED_MIME.includes(file.type)) {
        setErrorMessage(`"${file.name}" has an unsupported format. Only JPG, PNG, and WebP are allowed.`);
        continue;
      }

      if (file.size > MAX_SIZE_BYTES) {
        setErrorMessage(`"${file.name}" exceeds the 5.0 MB maximum file size limit.`);
        continue;
      }

      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

        newAttachments.push({
          id: `temp-${Date.now()}-${i}`,
          entry_id: '',
          owner_id: '',
          file_name: file.name,
          file_url: dataUrl,
          storage_path: `diary/temp/${Date.now()}_${file.name}`,
          media_type: file.type,
          file_size_bytes: file.size,
          caption: '',
          created_at: new Date().toISOString(),
        });
      } catch {
        setErrorMessage(`Failed to read file "${file.name}".`);
      }
    }

    onChange(newAttachments);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleCaptionChange = (index: number, caption: string) => {
    const updated = [...attachments];
    updated[index].caption = caption;
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Photographs & Receipts (Optional)
          </label>
          <p className="text-[11px] text-slate-500">
            Attach field condition pictures, leaf symptoms, or expense bills (Max 5MB each).
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="text-xs shrink-0"
        >
          <Camera className="w-3.5 h-3.5 mr-1 text-agri-600" />
          <span>Add Photo</span>
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
        id="diary-photo-input"
        aria-label="Upload photos and receipts"
      />

      {errorMessage && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Previews grid */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {attachments.map((att, idx) => (
            <div
              key={att.id || idx}
              className="flex items-start gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl relative"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                <img
                  src={att.file_url}
                  alt={att.file_name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-800 truncate" title={att.file_name}>
                    {att.file_name}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    aria-label={`Remove image ${att.file_name}`}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[10px] text-slate-400">
                  {(att.file_size_bytes / 1024).toFixed(0)} KB
                </p>

                <input
                  type="text"
                  placeholder="Add caption or note..."
                  value={att.caption || ''}
                  onChange={(e) => handleCaptionChange(idx, e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-agri-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
