'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  Camera, 
  Upload, 
  User, 
  X, 
  Check, 
  Loader2,
  Image as ImageIcon,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';

interface ProfileImageUploaderProps {
  currentImage?: string;
  onImageUpload: (file: File) => Promise<string>;
  onImageRemove?: () => Promise<void>;
  uploading?: boolean;
  className?: string;
}

export const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({
  currentImage,
  onImageUpload,
  onImageRemove,
  uploading = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar los 5MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await onImageUpload(selectedFile);
      setIsOpen(false);
      setPreviewImage(null);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleRemove = async () => {
    if (onImageRemove) {
      try {
        await onImageRemove();
        setIsOpen(false);
      } catch (error) {
        console.error('Error removing image:', error);
      }
    }
  };

  const resetSelection = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Avatar Display */}
      <div className={`relative ${className}`}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="relative cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <div className="w-32 h-32 bg-white rounded-3xl shadow-xl flex items-center justify-center border-4 border-white">
            <div className="w-28 h-28 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center relative overflow-hidden">
              {currentImage ? (
                <Image
                  src={currentImage}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  fill
                  sizes="112px"
                  style={{ objectFit: 'cover' }}
                  priority
                />
              ) : (
                <User size={40} className="text-white" />
              )}
              
              {/* Loading overlay */}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 size={24} className="text-white animate-spin" />
                </div>
              )}
            </div>
          </div>
          
          {/* Camera button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200"
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Camera size={16} />
            )}
          </motion.button>
        </motion.div>
      </div>

      {/* Upload Modal */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Camera size={24} className="text-indigo-600" />
              Cambiar Imagen de Perfil
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Image Preview */}
            {(previewImage || currentImage) && (
              <div className="text-center">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <Image
                    src={previewImage || currentImage || ''}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    fill
                    sizes="128px"
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  {previewImage ? 'Nueva imagen' : 'Imagen actual'}
                </p>
              </div>
            )}

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                dragOver 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
            >
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
                  <Upload size={24} className="text-gray-600" />
                </div>
                
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Arrastra una imagen aquí
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    O haz clic para seleccionar un archivo
                  </p>
                  
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    leftIcon={<ImageIcon size={16} />}
                  >
                    Seleccionar Archivo
                  </Button>
                </div>
                
                <p className="text-xs text-gray-400">
                  Formatos soportados: JPG, PNG, WebP (máx. 5MB)
                </p>
              </div>
            </div>

            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                fullWidth
                leftIcon={<Camera size={16} />}
                onClick={() => {
                  // Implementar captura de cámara si es necesario
                  fileInputRef.current?.click();
                }}
              >
                Tomar Foto
              </Button>
              
              {currentImage && (
                <Button
                  variant="outline"
                  fullWidth
                  leftIcon={<Trash2 size={16} />}
                  onClick={handleRemove}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Eliminar
                </Button>
              )}
            </div>

            {/* Predefined Avatars */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Avatares predefinidos</p>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-white hover:shadow-lg transition-all duration-200"
                    onClick={() => {
                      // Implementar selección de avatar predefinido
                      console.log(`Selected predefined avatar ${i}`);
                    }}
                  >
                    <User size={24} />
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  resetSelection();
                }}
                leftIcon={<X size={16} />}
                className="flex-1"
              >
                Cancelar
              </Button>
              
              {previewImage && (
                <Button
                  variant="outline"
                  onClick={resetSelection}
                  leftIcon={<RotateCcw size={16} />}
                >
                  Reiniciar
                </Button>
              )}
              
              <Button 
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                loading={uploading}
                leftIcon={<Check size={16} />}
                className="flex-1"
              >
                Guardar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
