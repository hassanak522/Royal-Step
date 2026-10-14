'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { UploadCloud, CheckCircle2, Loader2, X } from 'lucide-react';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  currentImage?: string;
}

export default function ImageUpload({ onImageUploaded, currentImage }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || '');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setPreview(data.url);
        onImageUploaded(data.url);
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Network error while uploading');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-xs font-bold uppercase text-neutral-700 mb-1.5">
        Product Photo (Direct Upload)
      </label>

      {preview ? (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-neutral-300 group">
          <Image src={preview} alt="Shoe preview" fill className="object-cover" />
          <button
            type="button"
            onClick={() => {
              setPreview('');
              onImageUploaded('');
            }}
            className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-black"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label className="border-2 border-dashed border-neutral-300 rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer hover:border-neutral-900 transition bg-neutral-50/50">
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-xs text-neutral-500">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-900" />
              <span>Uploading to CDN...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-center">
              <UploadCloud className="w-6 h-6 text-neutral-500" />
              <span className="text-xs font-semibold text-neutral-800">
                Click or drag photo here
              </span>
              <span className="text-[10px] text-neutral-400">JPG, PNG, WEBP up to 5MB</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}