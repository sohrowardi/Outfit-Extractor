
import React, { useState, useCallback, useRef, useEffect } from 'react';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  error?: string | null;
  onReset?: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, error, onReset }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const pastedFiles = event.clipboardData?.files;
      if (!pastedFiles || pastedFiles.length === 0) {
        return;
      }

      // Find the first actual image file among the pasted files
      const imageFile = Array.from(pastedFiles).find(file => file.type.startsWith('image/'));

      if (imageFile) {
        event.preventDefault();
        onImageUpload(imageFile);
      }
    };

    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [onImageUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onImageUpload(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [onImageUpload]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const dragDropClasses = isDragging
    ? 'border-purple-400 bg-gray-700/50 scale-105'
    : 'border-gray-600 hover:border-purple-400 hover:bg-gray-700/30';

  return (
    <div className="flex flex-col items-center justify-center text-center">
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-6 w-full max-w-md">
          <p className="font-semibold">An Error Occurred</p>
          <p className="text-sm">{error}</p>
          { onReset && 
            <button
                onClick={onReset}
                className="mt-3 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300"
            >
                Try Again
            </button>
          }
        </div>
      )}
      <div
        className={`relative w-full max-w-lg p-10 sm:p-16 border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out cursor-pointer ${dragDropClasses}`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
        aria-label="Image upload area"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          onChange={handleFileChange}
          aria-hidden="true"
        />
        <div className="flex flex-col items-center justify-center space-y-4">
          <svg
            className="w-16 h-16 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-xl font-semibold text-gray-300">
            Paste, Drag & Drop your image here
          </p>
          <p className="text-gray-400">or</p>
          <button
            type="button"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300"
          >
            Browse Files
          </button>
          <p className="text-xs text-gray-500 mt-2">Supports: PNG, JPG, WEBP</p>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;