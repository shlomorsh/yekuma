"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: number; // 1 = 1:1, 16/9 = 16:9, etc.
}

export default function ImageUploader({ value, onChange, aspectRatio = 1 }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('אנא בחר קובץ תמונה');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Calculate crop dimensions for 1:1 aspect ratio
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;

        canvas.width = size;
        canvas.height = size;

        ctx.drawImage(img, x, y, size, size, 0, 0, size, size);

        // Convert to blob and upload
        canvas.toBlob(async (blob) => {
          if (!blob) {
            setIsUploading(false);
            return;
          }

          try {
            // For now, use data URL directly
            // In production, you can upload to Supabase Storage or another service
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            onChange(dataUrl);
            setPreview(dataUrl);
            
            // TODO: Upload to Supabase Storage or image hosting service
            // const { data, error } = await supabase.storage
            //   .from('images')
            //   .upload(fileName, blob, { contentType: 'image/jpeg' });
          } catch (err) {
            // Fallback: use data URL
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            onChange(dataUrl);
            setPreview(dataUrl);
          }
          
          setIsUploading(false);
        }, 'image/jpeg', 0.9);
      };
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          handleFile(file);
        }
        break;
      }
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-zinc-700 hover:border-zinc-600'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onPaste={handlePaste}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        
        {preview ? (
          <div className="relative aspect-square w-full">
            <Image
              src={preview}
              alt="תצוגה מקדימה"
              fill
              className="object-cover rounded-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="wireframe-border px-4 py-2 bg-black text-white"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                החלף תמונה
              </button>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            {isUploading ? (
              <div className="space-y-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="text-zinc-400" style={{ fontFamily: 'var(--font-mono)' }}>מעלה תמונה...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <svg className="w-16 h-16 mx-auto text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="space-y-2">
                  <p className="text-white" style={{ fontFamily: 'var(--font-heebo)' }}>
                    גרור תמונה לכאן או לחץ להעלאה
                  </p>
                  <p className="text-sm text-zinc-400" style={{ fontFamily: 'var(--font-mono)' }}>
                    או הדבק תמונה (Ctrl+V)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="wireframe-border px-6 py-2 bg-black text-white hover:bg-white/10 transition-colors"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  בחר תמונה
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {preview && (
        <button
          type="button"
          onClick={() => {
            setPreview(null);
            onChange('');
          }}
          className="w-full wireframe-border px-4 py-2 bg-black text-red-400 hover:bg-red-400/10 transition-colors"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          מחק תמונה
        </button>
      )}
    </div>
  );
}

