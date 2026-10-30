// CropDiary AI — Farm Diary Service
// Encapsulates diary CRUD, timeline queries, media uploads, speech recognition, and summary stats.

import { storageAdapter } from '@/services/storageAdapter';
import {
  FarmDiaryEntry,
  DiaryFilterParams,
  DiarySummaryStats,
  DiaryAttachment,
} from '@/types/diary';
import { DiaryEntryFormData } from '@/lib/validation/diarySchemas';

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export const diaryService = {
  async getEntries(
    userId: string,
    filters?: DiaryFilterParams
  ): Promise<FarmDiaryEntry[]> {
    return storageAdapter.getDiaryEntries(userId, filters);
  },

  async getEntryById(
    userId: string,
    entryId: string
  ): Promise<FarmDiaryEntry | null> {
    return storageAdapter.getDiaryEntryById(userId, entryId);
  },

  async createEntry(
    userId: string,
    data: DiaryEntryFormData & { attachments?: DiaryAttachment[] }
  ): Promise<FarmDiaryEntry> {
    return storageAdapter.createDiaryEntry(userId, data);
  },

  async updateEntry(
    userId: string,
    entryId: string,
    updates: Partial<DiaryEntryFormData>
  ): Promise<FarmDiaryEntry> {
    return storageAdapter.updateDiaryEntry(userId, entryId, updates);
  },

  async archiveEntry(userId: string, entryId: string): Promise<FarmDiaryEntry> {
    return storageAdapter.updateDiaryEntry(userId, entryId, {
      status: 'archived',
    });
  },

  async deleteEntry(userId: string, entryId: string): Promise<void> {
    return storageAdapter.deleteDiaryEntry(userId, entryId);
  },

  async getSummaryStats(
    userId: string,
    farmId?: string
  ): Promise<DiarySummaryStats> {
    return storageAdapter.getDiarySummaryStats(userId, farmId);
  },

  /**
   * Safe upload for diary photos and receipt attachments (Max 5MB, JPEG/PNG/WebP).
   */
  async uploadAttachment(
    userId: string,
    entryId: string,
    file: File,
    caption?: string
  ): Promise<DiaryAttachment> {
    const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

    if (!ALLOWED_MIME.includes(file.type)) {
      throw new Error(`Unsupported image format (${file.type}). Allowed: JPG, PNG, WebP.`);
    }
    if (file.size > MAX_SIZE) {
      throw new Error('Image file size exceeds the 5.0 MB maximum limit.');
    }

    // Convert to persistent data URL for local storage or remote Supabase storage
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });

    const storagePath = `diary/${userId}/${entryId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    return storageAdapter.createDiaryAttachment(userId, {
      entry_id: entryId,
      owner_id: userId,
      file_name: file.name,
      file_url: dataUrl,
      storage_path: storagePath,
      media_type: file.type,
      file_size_bytes: file.size,
      caption: caption || null,
    });
  },

  /**
   * Browser Speech-to-Text helper (Web Speech API).
   */
  isSpeechRecognitionSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  },

  startSpeechRecognition(
    onResult: (text: string) => void,
    onError: (errMessage: string) => void,
    onEnd: () => void,
    lang = 'en-IN'
  ): { stop: () => void } | null {
    if (!this.isSpeechRecognitionSupported()) {
      onError('Speech recognition is not supported in this browser.');
      return null;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript.trim()) {
        onResult(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      onError(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      onEnd();
    };

    recognition.start();

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch {
          // ignore already stopped
        }
      },
    };
  },
};
