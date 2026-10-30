// CropDiary AI — Unified Voice Input Component
// Supports both compact icon mode (AI Assistant) and full form mode with live preview & actions (Farm Diary).
// Compatible with Web Speech API for English (en-IN) and Tamil (ta-IN).

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, AlertCircle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface VoiceInputButtonProps {
  variant?: 'icon' | 'form';
  language?: 'en' | 'ta';
  disabled?: boolean;
  onTranscript?: (transcription: string) => void;
  onAppendText?: (transcription: string) => void;
  onReplaceText?: (transcription: string) => void;
  className?: string;
}

interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  variant,
  language = 'en',
  disabled = false,
  onTranscript,
  onAppendText,
  onReplaceText,
  className = '',
}) => {
  const isFormMode = variant === 'form' || (!variant && (onAppendText || onReplaceText));

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = isFormMode;
      recognition.interimResults = isFormMode;
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        if (isFormMode) {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              interim += event.results[i][0].transcript;
            }
          }
          if (interim.trim()) {
            setLiveTranscript((prev) => (prev ? `${prev} ${interim.trim()}` : interim.trim()));
          }
        } else {
          if (event.results && event.results[0] && event.results[0][0]) {
            const transcript = event.results[0][0].transcript;
            if (transcript && onTranscript) {
              onTranscript(transcript);
            }
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setErrorMessage(language === 'ta' ? 'மைக் அனுமதி மறுக்கப்பட்டது' : 'Microphone access denied');
        } else if (event.error === 'no-speech') {
          setErrorMessage(language === 'ta' ? 'குரல் கேட்கவில்லை' : 'No speech detected');
        } else {
          setErrorMessage(language === 'ta' ? 'குரல் உள்ளீடு பிழை' : `Speech error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [language, isFormMode, onTranscript]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current || disabled) return;

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    } else {
      setErrorMessage(null);
      if (isFormMode) {
        setLiveTranscript('');
      }
      try {
        recognitionRef.current.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
        recognitionRef.current.start();
      } catch {
        setIsListening(false);
      }
    }
  }, [disabled, isListening, isFormMode, language]);

  const handleAppend = () => {
    if (liveTranscript.trim() && onAppendText) {
      onAppendText(liveTranscript.trim());
      setLiveTranscript('');
    }
  };

  const handleReplace = () => {
    if (liveTranscript.trim() && onReplaceText) {
      onReplaceText(liveTranscript.trim());
      setLiveTranscript('');
    }
  };

  const handleDiscard = () => {
    setLiveTranscript('');
    setErrorMessage(null);
  };

  if (!isSupported) {
    if (isFormMode) {
      return (
        <div className="text-[11px] text-slate-400 italic flex items-center gap-1">
          <MicOff className="w-3.5 h-3.5" />
          <span>Voice input unsupported in this browser</span>
        </div>
      );
    }
    return null;
  }

  // --- Form Mode (Diary Entries) ---
  if (isFormMode) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleListening}
            disabled={disabled}
            aria-label={isListening ? 'Stop voice recording' : 'Start voice recording'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isListening
                ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-400 animate-pulse'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isListening ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                <span>Listening... Click to Stop</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-agri-600" />
                <span>Voice Note (Speak)</span>
              </>
            )}
          </button>

          {isListening && (
            <span className="text-[11px] text-slate-500">
              Speak clearly into your microphone in English or Tamil.
            </span>
          )}
        </div>

        {errorMessage && (
          <div className="p-2 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {liveTranscript && (
          <div className="p-3 bg-agri-50/60 border border-agri-200 rounded-xl space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-agri-800">
                Voice Transcription Preview:
              </span>
              <button
                type="button"
                onClick={handleDiscard}
                aria-label="Discard voice transcription"
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-800 italic bg-white p-2 rounded-md border border-slate-200">
              "{liveTranscript}"
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              {onReplaceText && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReplace}
                  className="text-xs h-7 px-2.5"
                >
                  Replace Text
                </Button>
              )}
              {onAppendText && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAppend}
                  className="text-xs h-7 px-2.5"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Append to Description
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Icon Mode (AI Assistant Chat) ---
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        aria-label={
          isListening
            ? language === 'ta'
              ? 'குரல் பதிவை நிறுத்து'
              : 'Stop listening'
            : language === 'ta'
              ? 'குரல் மூலம் பேசு (தமிழ்)'
              : 'Speak voice message (English)'
        }
        aria-pressed={isListening}
        className={`p-2.5 rounded-lg transition-all flex items-center justify-center min-w-[44px] min-h-[44px] relative ${
          isListening
            ? 'bg-rose-500 text-white shadow-md animate-pulse ring-4 ring-rose-200 dark:ring-rose-900/50'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        )}
      </button>

      {errorMessage && (
        <div
          role="alert"
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-rose-600 text-white text-xs px-2.5 py-1 rounded shadow-lg flex items-center gap-1 z-30"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
