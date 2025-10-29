'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import { uploadImage } from '@/utils/storage/uploadImage';
import { Button } from '@/components/ui/Button';

interface ImageUploaderProps {
  currentImage?: string;
  onImageUpload: (url: string) => void;
  onImageRemove?: () => void;
  label?: string;
  maxSize?: number;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImage,
  onImageUpload,
  onImageRemove,
  label = "Logo del Comercio",
  maxSize = 5 * 1024 * 1024, // 5MB
  className = ""
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño
    if (file.size > maxSize) {
      setError(`El archivo es muy grande. Máximo ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const url = await uploadImage(file, 'comercios/logos', {
        maxSize,
        quality: 0.8,
        onProgress: (progressValue) => {
          setProgress(progressValue);
        }
      });

      onImageUpload(url);
      setProgress(100);
      
      // Mostrar éxito por un momento
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error instanceof Error ? error.message : 'Error al subir la imagen');
      setUploading(false);
      setProgress(0);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleRemoveImage = () => {
    if (onImageRemove) {
      onImageRemove();
    }
    setError(null);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <div className="space-y-4">
        {/* Área de subida */}
        <motion.div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-all duration-200 min-h-[200px] flex flex-col items-center justify-center
            ${dragOver 
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${uploading ? 'pointer-events-none' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={!uploading ? openFileDialog : undefined}
          whileHover={!uploading ? { scale: 1.02 } : {}}
          whileTap={!uploading ? { scale: 0.98 } : {}}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />

          <AnimatePresence mode="wait">
            {uploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center space-y-4"
              >
                {/* Barra de progreso circular */}
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                      className="text-blue-500 transition-all duration-300"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {progress === 100 ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {Math.round(progress)}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {progress === 100 ? '¡Imagen subida exitosamente!' : 'Subiendo imagen...'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {Math.round(progress)}% completado
                  </p>
                </div>
              </motion.div>
            ) : currentImage ? (
              <motion.div
                key="current-image"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group"
              >
                <img
                  src={currentImage}
                  alt="Logo actual"
                  className="max-w-full max-h-32 object-contain rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      openFileDialog();
                    }}
                    variant="secondary"
                    size="sm"
                    className="bg-white text-gray-800 hover:bg-gray-100"
                  >
                    <Camera className="w-4 h-4 mr-1" />
                    Cambiar
                  </Button>
                  {onImageRemove && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      variant="secondary"
                      size="sm"
                      className="bg-red-500 text-white hover:bg-red-600"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Eliminar
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="upload-prompt"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center space-y-3"
              >
                <Upload className="w-12 h-12 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Haz clic para subir o arrastra una imagen aquí
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    PNG, JPG, GIF hasta {Math.round(maxSize / 1024 / 1024)}MB
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};