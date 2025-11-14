'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  MessageSquare,
  Users,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Info,
  Gift,
  AlertTriangle,
} from 'lucide-react';
import { useSocios } from '@/hooks/useSocios';
import { useWhatsAppNotifications, WhatsAppRecipient } from '@/hooks/useWhatsAppNotifications';
import toast from 'react-hot-toast';

type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'benefit';
type PriorityType = 'low' | 'normal' | 'high' | 'urgent';

interface FormData {
  title: string;
  message: string;
  type: NotificationType;
  priority: PriorityType;
  recipients: string;
}

export const SendWhatsAppNotification: React.FC = () => {
  const { socios } = useSocios();
  const { loading, results, progress, sendWhatsAppNotification, clearResults } = useWhatsAppNotifications();
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    message: '',
    type: 'info',
    priority: 'normal',
    recipients: 'all'
  });

  const [selectedSocios, setSelectedSocios] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPhoneNumbers, setShowPhoneNumbers] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Filtrar socios activos con teléfono
  const activeSocios = useMemo(() => {
    return socios.filter(socio => 
      socio.estado === 'activo' && 
      socio.telefono && 
      socio.telefono.trim() !== ''
    );
  }, [socios]);

  // Filtrar socios por búsqueda
  const filteredSocios = useMemo(() => {
    return activeSocios.filter(socio =>
      socio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (socio.telefono && socio.telefono.includes(searchTerm))
    );
  }, [activeSocios, searchTerm]);

  // Preparar destinatarios
  const recipients: WhatsAppRecipient[] = useMemo(() => {
    const toSend = formData.recipients === 'all' ? activeSocios : 
                   activeSocios.filter(s => selectedSocios.includes(s.id));
    
    return toSend.map(socio => ({
      id: socio.id,
      name: socio.nombre,
      phone: socio.telefono || '',
      email: socio.email
    }));
  }, [formData.recipients, selectedSocios, activeSocios]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('El título es requerido');
      return;
    }

    if (!formData.message.trim()) {
      toast.error('El mensaje es requerido');
      return;
    }

    if (recipients.length === 0) {
      toast.error('Selecciona al menos un destinatario');
      return;
    }

    setShowResults(true);
    await sendWhatsAppNotification({
      title: formData.title,
      message: formData.message,
      recipients,
      priority: formData.priority
    });
  };

  const handleSelectAll = () => {
    if (selectedSocios.length === filteredSocios.length) {
      setSelectedSocios([]);
    } else {
      setSelectedSocios(filteredSocios.map(s => s.id));
    }
  };

  const typeOptions = [
    { value: 'info', label: 'Información', icon: Info, color: 'blue' },
    { value: 'success', label: 'Éxito', icon: CheckCircle, color: 'emerald' },
    { value: 'warning', label: 'Advertencia', icon: AlertTriangle, color: 'amber' },
    { value: 'error', label: 'Error', icon: AlertTriangle, color: 'red' },
    { value: 'benefit', label: 'Beneficio', icon: Gift, color: 'purple' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Baja', color: 'gray' },
    { value: 'normal', label: 'Normal', color: 'blue' },
    { value: 'high', label: 'Alta', color: 'amber' },
    { value: 'urgent', label: 'Urgente', color: 'red' }
  ];

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Enviar WhatsApp</h2>
        </div>
        <p className="text-slate-600">Comunícate directamente con tus clientes socios a través de WhatsApp</p>
      </div>

      <AnimatePresence mode="wait">
        {showResults && results.length > 0 ? (
          // Resultados
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Resumen */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-slate-900 mb-2">{results.length}</div>
                  <div className="text-slate-600">Total Enviados</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-600 mb-2">{successCount}</div>
                  <div className="text-slate-600">Exitosos</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-600 mb-2">{failureCount}</div>
                  <div className="text-slate-600">Errores</div>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Progreso</span>
                  <span className="text-sm font-semibold text-slate-900">100%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full w-full transition-all duration-300" />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowResults(false);
                    clearResults();
                    setFormData({
                      title: '',
                      message: '',
                      type: 'info',
                      priority: 'normal',
                      recipients: 'all'
                    });
                    setSelectedSocios([]);
                  }}
                  className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
                >
                  Enviar Otro
                </button>
                <button
                  onClick={() => setShowResults(false)}
                  className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Volver
                </button>
              </div>
            </div>

            {/* Detalles de envíos */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Detalles de Envío</h3>
              </div>
              
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <motion.div
                    key={result.recipientId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          result.success 
                            ? 'bg-emerald-100' 
                            : 'bg-red-100'
                        }`}>
                          {result.success ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 truncate">
                            {result.recipientName}
                          </div>
                          <div className="text-sm text-slate-500 truncate">
                            {result.phone}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {result.success ? (
                          <div className="text-sm">
                            <div className="font-medium text-emerald-600">Enviado</div>
                            {result.messageId && (
                              <div className="text-xs text-slate-500 truncate max-w-xs">
                                ID: {result.messageId}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm">
                            <div className="font-medium text-red-600">Error</div>
                            <div className="text-xs text-slate-500 truncate max-w-xs">
                              {result.error}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          // Formulario
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 space-y-6"
          >
            {/* Título */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Ej: Promoción especial para ti"
                required
              />
            </div>

            {/* Mensaje */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Mensaje *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={5}
                maxLength={1000}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                placeholder="Escribe tu mensaje aquí. Será enviado a través de WhatsApp..."
                required
              />
              <div className="text-xs text-slate-500 mt-1">
                {formData.message.length}/1000 caracteres
              </div>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Tipo de Notificación
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {typeOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.type === option.value
                        ? `border-${option.color}-500 bg-${option.color}-50`
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={option.value}
                      checked={formData.type === option.value}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as NotificationType })
                      }
                      className="sr-only"
                    />
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                      <option.icon className={`w-4 h-4 text-${option.color}-600`} />
                    </div>
                    <span className="text-xs font-medium text-slate-700 text-center">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Prioridad */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Prioridad
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityType })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Destinatarios */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Destinatarios ({recipients.length} seleccionados)
              </label>
              
              <div className="space-y-4">
                {/* Opciones de selección */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, recipients: 'all' })}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      formData.recipients === 'all'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Todos ({activeSocios.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, recipients: 'specific' })}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      formData.recipients === 'specific'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Seleccionar
                  </button>
                </div>

                {/* Lista de socios */}
                {formData.recipients === 'specific' && (
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    {/* Búsqueda */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre, email o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Seleccionar todo */}
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={selectedSocios.length === filteredSocios.length && filteredSocios.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-medium text-slate-700">
                          Seleccionar todos ({filteredSocios.length})
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPhoneNumbers(!showPhoneNumbers)}
                        className="p-2 text-slate-500 hover:text-slate-700"
                      >
                        {showPhoneNumbers ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Lista de socios */}
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {filteredSocios.length === 0 ? (
                        <div className="text-center py-6 text-slate-500">
                          No se encontraron socios
                        </div>
                      ) : (
                        filteredSocios.map((socio) => (
                          <label
                            key={socio.id}
                            className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-slate-50 cursor-pointer border border-slate-200"
                          >
                            <input
                              type="checkbox"
                              checked={selectedSocios.includes(socio.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSocios([...selectedSocios, socio.id]);
                                } else {
                                  setSelectedSocios(selectedSocios.filter(id => id !== socio.id));
                                }
                              }}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-900">{socio.nombre}</div>
                              <div className="text-sm text-slate-500 truncate">{socio.email}</div>
                              {showPhoneNumbers && (
                                <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                  <Phone className="w-3 h-3" />
                                  {socio.telefono}
                                </div>
                              )}
                            </div>
                            {showPhoneNumbers && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigator.clipboard.writeText(socio.telefono || '');
                                  toast.success('Teléfono copiado');
                                }}
                                className="p-1 text-slate-400 hover:text-slate-600"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            )}
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Resumen de destinatarios */}
                {formData.recipients === 'all' && activeSocios.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">
                        Se enviará a {activeSocios.length} cliente{activeSocios.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botón de envío */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading || recipients.length === 0}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando... {progress}%
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar WhatsApp ({recipients.length})
                  </>
                )}
              </button>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Información importante:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Los mensajes se enviarán a través de WhatsApp</li>
                    <li>Solo se enviarán a socios con números de teléfono válidos</li>
                    <li>Se soportan números internacionales</li>
                    <li>Verifica que los números estén correctos antes de enviar</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SendWhatsAppNotification;