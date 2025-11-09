'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Sheet, Code } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'excel' | 'json') => Promise<void>;
  isLoading?: boolean;
}

export function ExportDialog({ isOpen, onClose, onExport, isLoading = false }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'excel' | 'json'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await onExport(selectedFormat);
      onClose();
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error al exportar los datos');
    } finally {
      setIsExporting(false);
    }
  };

  const formats = [
    {
      id: 'csv',
      name: 'CSV',
      description: 'Compatible con Excel y Google Sheets',
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      recommended: true
    },
    {
      id: 'excel',
      name: 'Excel',
      description: 'Formato .xlsx con estilos',
      icon: Sheet,
      color: 'from-green-500 to-green-600',
      recommended: false
    },
    {
      id: 'json',
      name: 'JSON',
      description: 'Formato JSON estructurado',
      icon: Code,
      color: 'from-purple-500 to-purple-600',
      recommended: false
    }
  ];

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Download className="text-blue-600" size={24} />
            Exportar Socios
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-6">
          <p className="text-sm text-gray-600">
            Selecciona el formato en el que deseas exportar los datos de tus socios:
          </p>

          <div className="space-y-3">
            {formats.map((format) => {
              const Icon = format.icon;
              const isSelected = selectedFormat === format.id;

              return (
                <motion.button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id as 'csv' | 'excel' | 'json')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-white flex-shrink-0 bg-gradient-to-br ${format.color}`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{format.name}</h3>
                        {format.recommended && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            Recomendado
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> El archivo se descargará con la fecha actual en el nombre.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting || isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            loading={isExporting || isLoading}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            <Download size={16} className="mr-2" />
            Exportar como {selectedFormat.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ExportDialog;