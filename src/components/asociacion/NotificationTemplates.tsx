'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Send,
  Users,
  UserCheck,
  Gift,
  CheckCircle,
  AlertCircle,
  Calendar,
  Mail,
  MessageSquare,
  Copy,
  Sparkles,
  TrendingUp,
  X,
  Eye
} from 'lucide-react';
import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';
import { useSocios } from '@/hooks/useSocios';
import { SimpleNotificationChannel } from '@/types/simple-notification';
import toast from 'react-hot-toast';

// Tipos de plantillas
type TemplateType = 
  | 'account_creation'
  | 'membership_expiration'
  | 'new_benefit'
  | 'benefit_used'
  | 'payment_overdue';

// Tipo de destinatarios
type RecipientType = 
  | 'all'           // Todos los socios
  | 'expired'       // Socios vencidos
  | 'active'        // Socios al día
  | 'specific';     // Elegir socios específicos

// Interfaz de plantilla
interface NotificationTemplate {
  id: TemplateType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
  category: 'automatic' | 'manual';
  defaultTitle: string;
  defaultMessage: string;
  variables: string[];
  recipientOptions: RecipientType[];
  suggestedChannels: SimpleNotificationChannel[];
}

// Plantillas predefinidas
const templates: NotificationTemplate[] = [
  {
    id: 'account_creation',
    name: 'Creación de Cuenta',
    description: 'Se envía automáticamente al crear una cuenta nueva',
    icon: UserCheck,
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    category: 'automatic',
    defaultTitle: '¡Bienvenido a {asociacion}!',
    defaultMessage: 'Hola {nombre},\n\n¡Bienvenido a nuestra asociación! Tu cuenta ha sido creada exitosamente.\n\nTu número de socio es: {numeroSocio}\n\nYa puedes comenzar a disfrutar de todos los beneficios que tenemos para ti.\n\n¡Gracias por unirte a nosotros!',
    variables: ['{nombre}', '{asociacion}', '{numeroSocio}', '{email}'],
    recipientOptions: ['specific'],
    suggestedChannels: ['email', 'whatsapp']
  },
  {
    id: 'membership_expiration',
    name: 'Vencimiento de Cuota',
    description: 'Recordatorio de vencimiento próximo de cuota',
    icon: Calendar,
    color: 'orange',
    gradient: 'from-orange-500 to-orange-600',
    category: 'manual',
    defaultTitle: 'Recordatorio: Tu cuota está por vencer',
    defaultMessage: 'Hola {nombre},\n\nTe recordamos que tu cuota de socio vence el {fechaVencimiento}.\n\nMonto: ${montoCuota}\n\nPor favor, realiza el pago para seguir disfrutando de todos los beneficios.\n\n¡Gracias por tu compromiso!',
    variables: ['{nombre}', '{fechaVencimiento}', '{montoCuota}', '{numeroSocio}'],
    recipientOptions: ['all', 'expired', 'active', 'specific'],
    suggestedChannels: ['email', 'whatsapp']
  },
  {
    id: 'new_benefit',
    name: 'Nuevo Beneficio',
    description: 'Anuncio de un nuevo beneficio disponible',
    icon: Gift,
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
    category: 'manual',
    defaultTitle: '🎉 ¡Nuevo beneficio disponible!',
    defaultMessage: 'Hola {nombre},\n\n¡Tenemos un nuevo beneficio para ti!\n\n{beneficioNombre}\n{beneficioDescripcion}\n\nDisponible en: {comercioNombre}\n\n¡No te lo pierdas!',
    variables: ['{nombre}', '{beneficioNombre}', '{beneficioDescripcion}', '{comercioNombre}'],
    recipientOptions: ['all', 'active', 'specific'],
    suggestedChannels: ['email', 'whatsapp']
  },
  {
    id: 'benefit_used',
    name: 'Beneficio Usado',
    description: 'Confirmación automática de uso de beneficio',
    icon: CheckCircle,
    color: 'emerald',
    gradient: 'from-emerald-500 to-emerald-600',
    category: 'automatic',
    defaultTitle: '✅ Beneficio utilizado exitosamente',
    defaultMessage: 'Hola {nombre},\n\nHas utilizado el beneficio:\n{beneficioNombre}\n\nComercio: {comercioNombre}\nFecha: {fecha}\nHora: {hora}\n\n¡Gracias por usar nuestros beneficios!',
    variables: ['{nombre}', '{beneficioNombre}', '{comercioNombre}', '{fecha}', '{hora}'],
    recipientOptions: ['specific'],
    suggestedChannels: ['email', 'whatsapp']
  },
  {
    id: 'payment_overdue',
    name: 'Atraso en el Pago',
    description: 'Notificación de cuota vencida',
    icon: AlertCircle,
    color: 'red',
    gradient: 'from-red-500 to-red-600',
    category: 'manual',
    defaultTitle: '⚠️ Tu cuota está vencida',
    defaultMessage: 'Hola {nombre},\n\nTu cuota de socio venció el {fechaVencimiento}.\n\nMonto adeudado: ${montoCuota}\n\nPor favor, regulariza tu situación para seguir disfrutando de los beneficios.\n\nSi ya realizaste el pago, ignora este mensaje.',
    variables: ['{nombre}', '{fechaVencimiento}', '{montoCuota}', '{numeroSocio}', '{diasVencido}'],
    recipientOptions: ['expired', 'specific'],
    suggestedChannels: ['email', 'whatsapp']
  }
];

// Componente de tarjeta de plantilla
const TemplateCard = ({ 
  template, 
  onSelect 
}: { 
  template: NotificationTemplate; 
  onSelect: (template: NotificationTemplate) => void;
}) => {
  const Icon = template.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-slate-50/40 rounded-2xl blur-xl" />
      <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 bg-gradient-to-r ${template.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex items-center gap-2">
            {template.category === 'automatic' ? (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Auto
              </span>
            ) : (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full flex items-center gap-1">
                <Send className="w-3 h-3" />
                Manual
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-slate-900 mb-2">{template.name}</h3>
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{template.description}</p>

        {/* Variables */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {template.variables.slice(0, 3).map((variable) => (
              <span
                key={variable}
                className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg font-mono"
              >
                {variable}
              </span>
            ))}
            {template.variables.length > 3 && (
              <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">
                +{template.variables.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Channels */}
        <div className="flex items-center gap-2 mb-4">
          {template.suggestedChannels.map((channel) => (
            <div
              key={channel}
              className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg"
            >
              {channel === 'email' ? (
                <Mail className="w-3 h-3 text-blue-600" />
              ) : (
                <MessageSquare className="w-3 h-3 text-emerald-600" />
              )}
              <span className="text-xs text-slate-600 capitalize">{channel}</span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={() => onSelect(template)}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r ${template.gradient} text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 group-hover:scale-105`}
        >
          {template.category === 'automatic' ? (
            <>
              <Eye className="w-4 h-4" />
              Ver Plantilla
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Usar Plantilla
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

// Componente de editor de plantilla
const TemplateEditor = ({
  template,
  onClose,
  onSend
}: {
  template: NotificationTemplate;
  onClose: () => void;
  onSend: (data: {
    title: string;
    message: string;
    channels: SimpleNotificationChannel[];
    recipientType: RecipientType;
    specificRecipients?: string[];
  }) => void;
}) => {
  const { socios } = useSocios();
  const [title, setTitle] = useState(template.defaultTitle);
  const [message, setMessage] = useState(template.defaultMessage);
  const [channels, setChannels] = useState<SimpleNotificationChannel[]>(template.suggestedChannels);
  const [recipientType, setRecipientType] = useState<RecipientType>(
    template.recipientOptions[0] || 'all'
  );
  const [specificRecipients, setSpecificRecipients] = useState<string[]>([]);
  const [showRecipientSelector, setShowRecipientSelector] = useState(false);

  // Filtrar socios según el tipo de destinatario
  const getFilteredSocios = () => {
    switch (recipientType) {
      case 'all':
        return socios.filter(s => s.estado === 'activo');
      case 'expired':
        return socios.filter(s => s.estadoMembresia === 'vencido');
      case 'active':
        return socios.filter(s => s.estadoMembresia === 'al_dia');
      case 'specific':
        return socios.filter(s => specificRecipients.includes(s.id));
      default:
        return [];
    }
  };

  const recipientCount = getFilteredSocios().length;

  const handleInsertVariable = (variable: string) => {
    setMessage(prev => prev + ' ' + variable);
  };

  const handleSubmit = () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Por favor completa el título y el mensaje');
      return;
    }

    if (channels.length === 0) {
      toast.error('Selecciona al menos un canal de envío');
      return;
    }

    if (recipientType === 'specific' && specificRecipients.length === 0) {
      toast.error('Selecciona al menos un destinatario');
      return;
    }

    onSend({
      title,
      message,
      channels,
      recipientType,
      specificRecipients: recipientType === 'specific' ? specificRecipients : undefined
    });
  };

  const Icon = template.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${template.gradient} p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{template.name}</h2>
                <p className="text-white/80 text-sm">{template.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Título de la Notificación
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingresa el título..."
              />
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Mensaje
                </label>
                <span className="text-xs text-slate-500">
                  {message.length}/500 caracteres
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                maxLength={500}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Escribe tu mensaje..."
              />
            </div>

            {/* Variables */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Variables Disponibles
              </label>
              <div className="flex flex-wrap gap-2">
                {template.variables.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => handleInsertVariable(variable)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-mono"
                  >
                    <Copy className="w-3 h-3" />
                    {variable}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Haz clic en una variable para insertarla en el mensaje
              </p>
            </div>

            {/* Channels */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Canales de Envío
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    channels.includes('email')
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={channels.includes('email')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setChannels([...channels, 'email']);
                      } else {
                        setChannels(channels.filter(c => c !== 'email'));
                      }
                    }}
                    className="sr-only"
                  />
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Email</div>
                    <div className="text-xs text-slate-600">Correo electrónico</div>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    channels.includes('whatsapp')
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={channels.includes('whatsapp')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setChannels([...channels, 'whatsapp']);
                      } else {
                        setChannels(channels.filter(c => c !== 'whatsapp'));
                      }
                    }}
                    className="sr-only"
                  />
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">WhatsApp</div>
                    <div className="text-xs text-slate-600">Mensaje directo</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Recipients */}
            {template.category === 'manual' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Destinatarios
                </label>
                <div className="space-y-3">
                  {template.recipientOptions.map((option) => (
                    <label
                      key={option}
                      className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        recipientType === option
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="recipientType"
                          checked={recipientType === option}
                          onChange={() => setRecipientType(option)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div>
                          <div className="font-medium text-slate-900">
                            {option === 'all' && 'Todos los socios'}
                            {option === 'expired' && 'Socios vencidos'}
                            {option === 'active' && 'Socios al día'}
                            {option === 'specific' && 'Elegir socios específicos'}
                          </div>
                          <div className="text-xs text-slate-600">
                            {option === 'all' && 'Enviar a todos los socios activos'}
                            {option === 'expired' && 'Solo socios con cuota vencida'}
                            {option === 'active' && 'Solo socios con cuota al día'}
                            {option === 'specific' && 'Seleccionar manualmente'}
                          </div>
                        </div>
                      </div>
                      {recipientType === option && option !== 'specific' && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          {recipientCount} socios
                        </span>
                      )}
                    </label>
                  ))}
                </div>

                {/* Specific Recipients Selector */}
                {recipientType === 'specific' && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-700">
                        {specificRecipients.length} socio{specificRecipients.length !== 1 ? 's' : ''} seleccionado{specificRecipients.length !== 1 ? 's' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowRecipientSelector(!showRecipientSelector)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {showRecipientSelector ? 'Ocultar' : 'Seleccionar'}
                      </button>
                    </div>

                    {showRecipientSelector && (
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {socios.filter(s => s.estado === 'activo').map((socio) => (
                          <label
                            key={socio.id}
                            className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={specificRecipients.includes(socio.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSpecificRecipients([...specificRecipients, socio.id]);
                                } else {
                                  setSpecificRecipients(specificRecipients.filter(id => id !== socio.id));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-slate-900">{socio.nombre}</div>
                              <div className="text-xs text-slate-600">{socio.email}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Preview */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-slate-600" />
                <h3 className="font-semibold text-slate-900">Vista Previa</h3>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="font-semibold text-slate-900 mb-2">{title || 'Título de la notificación'}</div>
                <div className="text-sm text-slate-600 whitespace-pre-wrap">{message || 'Mensaje de la notificación'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users className="w-4 h-4" />
              <span>
                Se enviará a <strong>{recipientCount}</strong> destinatario{recipientCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={template.category === 'automatic'}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  template.category === 'automatic'
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : `bg-gradient-to-r ${template.gradient} text-white hover:shadow-lg`
                }`}
              >
                <Send className="w-4 h-4" />
                {template.category === 'automatic' ? 'Plantilla Automática' : 'Enviar Notificación'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Componente principal
export const NotificationTemplates = () => {
  const { sendNotification } = useSimpleNotifications();
  const { socios } = useSocios();
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [filter, setFilter] = useState<'all' | 'automatic' | 'manual'>('all');

  const filteredTemplates = templates.filter(template => {
    if (filter === 'all') return true;
    return template.category === filter;
  });

  const handleSendNotification = async (data: {
    title: string;
    message: string;
    channels: SimpleNotificationChannel[];
    recipientType: RecipientType;
    specificRecipients?: string[];
  }) => {
    const loadingToast = toast.loading('Enviando notificaciones...');
    
    try {
      // Determinar los socios destinatarios
      let targetSocios = [];

      if (data.recipientType === 'specific' && data.specificRecipients) {
        targetSocios = socios.filter(s => data.specificRecipients!.includes(s.id));
      } else {
        targetSocios = socios.filter(socio => {
          if (data.recipientType === 'all') return socio.estado === 'activo';
          if (data.recipientType === 'expired') return socio.estadoMembresia === 'vencido';
          if (data.recipientType === 'active') return socio.estadoMembresia === 'al_dia';
          return false;
        });
      }

      if (targetSocios.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('No hay destinatarios para enviar la notificación');
        return;
      }

      console.log(`📤 Enviando notificaciones personalizadas a ${targetSocios.length} socios`);

      // Enviar notificación personalizada a cada socio
      let successCount = 0;
      let errorCount = 0;

      for (const socio of targetSocios) {
        try {
          // Reemplazar variables con datos reales del socio
          const personalizedTitle = replaceVariables(data.title, socio);
          const personalizedMessage = replaceVariables(data.message, socio);

          console.log(`👤 Enviando a ${socio.nombre}:`, {
            title: personalizedTitle,
            messagePreview: personalizedMessage.substring(0, 100)
          });

          // Enviar notificación individual
          await sendNotification({
            title: personalizedTitle,
            message: personalizedMessage,
            type: 'info',
            channels: data.channels,
            recipientIds: [socio.id]
          });

          successCount++;
          
          // Pequeña pausa entre envíos para evitar sobrecarga
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error enviando a ${socio.nombre}:`, error);
          errorCount++;
        }
      }

      toast.dismiss(loadingToast);

      if (errorCount === 0) {
        toast.success(`✅ ${successCount} notificación${successCount !== 1 ? 'es' : ''} enviada${successCount !== 1 ? 's' : ''} exitosamente`);
      } else {
        toast.error(`⚠️ ${successCount} enviadas, ${errorCount} con errores`);
      }

      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error sending notifications:', error);
      toast.dismiss(loadingToast);
      toast.error('Error al enviar las notificaciones');
    }
  };

  // Función para reemplazar variables con datos reales
  const replaceVariables = (text: string, socio: typeof socios[0]): string => {
    let result = text;

    // Variables del socio
    result = result.replace(/{nombre}/g, socio.nombre || '');
    result = result.replace(/{email}/g, socio.email || '');
    result = result.replace(/{numeroSocio}/g, socio.numeroSocio || '');
    result = result.replace(/{telefono}/g, socio.telefono || '');
    result = result.replace(/{dni}/g, socio.dni || '');

    // Variables de cuota
    result = result.replace(/{montoCuota}/g, socio.montoCuota?.toString() || '0');
    
    // Variables de fechas
    if (socio.fechaVencimiento) {
      // Manejar tanto Timestamp de Firestore como Date
      let fechaVenc: Date;
      try {
        // Intentar usar toDate() si existe (Timestamp de Firestore)
        if (typeof socio.fechaVencimiento === 'object' && socio.fechaVencimiento !== null && 'toDate' in socio.fechaVencimiento && typeof socio.fechaVencimiento.toDate === 'function') {
          fechaVenc = (socio.fechaVencimiento as { toDate: () => Date }).toDate();
        } else if (socio.fechaVencimiento instanceof Date) {
          // Ya es un Date
          fechaVenc = socio.fechaVencimiento;
        } else {
          // Es un string, número o cualquier otro tipo, intentar convertir
          fechaVenc = new Date(socio.fechaVencimiento as never);
        }
        
        result = result.replace(/{fechaVencimiento}/g, fechaVenc.toLocaleDateString('es-AR'));
        
        // Calcular días vencidos
        const hoy = new Date();
        const diasVencido = Math.floor((hoy.getTime() - fechaVenc.getTime()) / (1000 * 60 * 60 * 24));
        result = result.replace(/{diasVencido}/g, diasVencido > 0 ? diasVencido.toString() : '0');
      } catch (error) {
        console.error('Error procesando fechaVencimiento:', error);
        result = result.replace(/{fechaVencimiento}/g, 'No especificada');
        result = result.replace(/{diasVencido}/g, '0');
      }
    } else {
      result = result.replace(/{fechaVencimiento}/g, 'No especificada');
      result = result.replace(/{diasVencido}/g, '0');
    }

    // Variables de fecha y hora actual
    const ahora = new Date();
    result = result.replace(/{fecha}/g, ahora.toLocaleDateString('es-AR'));
    result = result.replace(/{hora}/g, ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));

    // Variables de asociación (estas deberían venir del contexto de la asociación)
    result = result.replace(/{asociacion}/g, 'Tu Asociación'); // TODO: Obtener nombre real de la asociación

    // Variables de beneficio (estas se llenarían cuando se use la plantilla desde un contexto de beneficio)
    result = result.replace(/{beneficioNombre}/g, '[Nombre del Beneficio]');
    result = result.replace(/{beneficioDescripcion}/g, '[Descripción del Beneficio]');
    result = result.replace(/{comercioNombre}/g, '[Nombre del Comercio]');

    return result;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Plantillas de Notificaciones</h1>
              <p className="text-slate-600">Usa plantillas pre-armadas para comunicarte con tus socios</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('automatic')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filter === 'automatic'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Automáticas
            </button>
            <button
              onClick={() => setFilter('manual')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filter === 'manual'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Manuales
            </button>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Plantillas Automáticas</h3>
              <p className="text-sm text-blue-700">
                Se envían automáticamente cuando ocurre un evento específico (creación de cuenta, uso de beneficio, etc.)
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900 mb-1">Plantillas Manuales</h3>
              <p className="text-sm text-purple-700">
                Puedes personalizarlas y enviarlas cuando lo necesites a los destinatarios que elijas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={setSelectedTemplate}
          />
        ))}
      </div>

      {/* Template Editor Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <TemplateEditor
            template={selectedTemplate}
            onClose={() => setSelectedTemplate(null)}
            onSend={handleSendNotification}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

