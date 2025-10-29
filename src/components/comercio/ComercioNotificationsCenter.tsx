'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Send,
  History,
  BarChart3,
  Users,
  MessageSquare,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Calendar,
  Download,
  Target,
  Activity,
  Eye,
  RefreshCw,
  Store,
  UserCheck,
  X,
  Plus,
  Megaphone
} from 'lucide-react';
import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';
import { useClientes } from '@/hooks/useClientes';
import { SimpleNotificationChannel } from '@/types/simple-notification';
import { toast } from 'react-hot-toast';

// Interfaces
interface NotificationStats {
  total: number;
  sent: number;
  pending: number;
  failed: number;
  todayCount: number;
  weekCount: number;
  successRate: number;
}

interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  description: string;
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: 'socio';
  status: string;
}

// Tab configurations
const tabs: TabConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    gradient: 'from-blue-500 to-blue-600',
    description: 'Vista general y estadísticas'
  },
  {
    id: 'enviar',
    label: 'Enviar',
    icon: Send,
    gradient: 'from-emerald-500 to-emerald-600',
    description: 'Crear y enviar notificaciones'
  },
  {
    id: 'historial',
    label: 'Historial',
    icon: History,
    gradient: 'from-purple-500 to-purple-600',
    description: 'Registro de notificaciones enviadas'
  }
];

// Dashboard Component
const Dashboard = ({ stats }: { stats: NotificationStats }) => {
  const [timeRange, setTimeRange] = useState('7d');
  
  const statCards = [
    {
      title: 'Total Enviadas',
      value: stats.total,
      icon: Bell,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Exitosas',
      value: stats.sent,
      icon: CheckCircle,
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600'
    },
    {
      title: 'Tasa de Éxito',
      value: `${stats.successRate}%`,
      icon: Target,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Esta Semana',
      value: stats.weekCount,
      icon: Calendar,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600'
    }
  ];

  const channelStats = [
    { name: 'WhatsApp', count: Math.floor(stats.sent * 0.7), color: 'emerald', icon: MessageSquare },
    { name: 'Email', count: Math.floor(stats.sent * 0.3), color: 'blue', icon: Mail }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Dashboard de Notificaciones</h2>
          <p className="text-slate-600">Monitorea el rendimiento de tus comunicaciones con socios</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
          </select>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
              <div className="text-sm text-slate-600">{stat.title}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Channel Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Distribución por Canal</h3>
          <div className="space-y-4">
            {channelStats.map((channel) => (
              <div key={channel.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 bg-${channel.color}-100 rounded-lg flex items-center justify-center`}>
                    <channel.icon className={`w-4 h-4 text-${channel.color}-600`} />
                  </div>
                  <span className="font-medium text-slate-700">{channel.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-slate-100 rounded-full h-2">
                    <div 
                      className={`h-2 bg-${channel.color}-500 rounded-full transition-all duration-500`}
                      style={{ width: `${stats.sent > 0 ? (channel.count / stats.sent) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 w-8">{channel.count}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Recipient Selector Component
const RecipientSelector = ({ 
  selectedRecipients, 
  onRecipientsChange 
}: { 
  selectedRecipients: Recipient[], 
  onRecipientsChange: (recipients: Recipient[]) => void 
}) => {
  const { clientes } = useClientes();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSelector, setShowSelector] = useState(false);

  // Convert clientes to recipients format - SOLO SOCIOS ACTIVOS
  const allRecipients: Recipient[] = clientes
    .filter(cliente => cliente.estado === 'activo')
    .map(cliente => ({
      id: cliente.id,
      name: cliente.nombre,
      email: cliente.email,
      phone: cliente.telefono,
      type: 'socio' as const,
      status: cliente.estado
    }));

  // Filter recipients based on search
  const filteredRecipients = allRecipients.filter(recipient => {
    const matchesSearch = recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipient.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch && !selectedRecipients.find(r => r.id === recipient.id);
  });

  const handleAddRecipient = (recipient: Recipient) => {
    onRecipientsChange([...selectedRecipients, recipient]);
  };

  const handleRemoveRecipient = (recipientId: string) => {
    onRecipientsChange(selectedRecipients.filter(r => r.id !== recipientId));
  };

  const handleSelectAll = () => {
    const newRecipients = allRecipients.filter(r => !selectedRecipients.find(sr => sr.id === r.id));
    onRecipientsChange([...selectedRecipients, ...newRecipients]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-700">
          Destinatarios Específicos
        </label>
        <button
          type="button"
          onClick={() => setShowSelector(!showSelector)}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Seleccionar
        </button>
      </div>

      {/* Selected Recipients */}
      {selectedRecipients.length > 0 && (
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">
              {selectedRecipients.length} socio{selectedRecipients.length !== 1 ? 's' : ''} seleccionado{selectedRecipients.length !== 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={() => onRecipientsChange([])}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Limpiar todo
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {selectedRecipients.map((recipient) => (
              <div
                key={recipient.id}
                className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-slate-200"
              >
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm text-slate-700">{recipient.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRecipient(recipient.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recipient Selector Modal */}
      {showSelector && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Seleccionar Socios</h3>
            <button
              type="button"
              onClick={() => setShowSelector(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleSelectAll}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Seleccionar Todos ({allRecipients.length})
            </button>
          </div>

          {/* Recipients List */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredRecipients.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>
                  {allRecipients.length === 0 
                    ? 'No hay socios activos disponibles'
                    : 'No se encontraron socios'
                  }
                </p>
                {allRecipients.length === 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    Agrega socios desde la pestaña &quot;Socios&quot;
                  </p>
                )}
              </div>
            ) : (
              filteredRecipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{recipient.name}</div>
                      <div className="text-sm text-slate-500">{recipient.email}</div>
                      {recipient.phone && (
                        <div className="text-xs text-slate-400">{recipient.phone}</div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleAddRecipient(recipient)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    Agregar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Send Notification Component
const SendNotification = () => {
  const { sendNotification } = useSimpleNotifications();
  const { clientes } = useClientes();
  const [loading, setLoading] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    channels: ['email'],
    recipients: 'all',
    priority: 'normal'
  });

  // Convert clientes to recipients format - SOLO SOCIOS ACTIVOS
  const availableRecipients: Recipient[] = clientes
    .filter(cliente => cliente.estado === 'activo')
    .map(cliente => ({
      id: cliente.id,
      name: cliente.nombre,
      email: cliente.email,
      phone: cliente.telefono,
      type: 'socio' as const,
      status: cliente.estado
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    if (formData.channels.length === 0) {
      toast.error('Selecciona al menos un canal de envío');
      return;
    }

    if (formData.recipients === 'specific' && selectedRecipients.length === 0) {
      toast.error('Selecciona al menos un socio específico');
      return;
    }

    if (formData.recipients === 'all' && availableRecipients.length === 0) {
      toast.error('No hay socios activos disponibles para enviar notificaciones');
      return;
    }

    setLoading(true);
    try {
      // Prepare recipient IDs based on selection type
      let recipientIds: string[] = [];
      
      if (formData.recipients === 'specific') {
        recipientIds = selectedRecipients.map(r => r.id);
      } else {
        // All active socios
        recipientIds = availableRecipients.map(r => r.id);
      }

      const notificationData = {
        title: formData.title,
        message: formData.message,
        type: 'info' as const,
        channels: formData.channels as SimpleNotificationChannel[],
        recipientIds: recipientIds
      };

      console.log('🔍 Notification data being sent:', notificationData);
      console.log('🔍 Available recipients:', availableRecipients.length);
      console.log('🔍 Recipient IDs:', recipientIds);

      await sendNotification(notificationData);
      
      toast.success(`Notificación enviada exitosamente a ${
        formData.recipients === 'specific' 
          ? `${selectedRecipients.length} socio${selectedRecipients.length !== 1 ? 's' : ''}`
          : `${availableRecipients.length} socio${availableRecipients.length !== 1 ? 's' : ''}`
      }`);
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        channels: ['email'],
        recipients: 'all',
        priority: 'normal'
      });
      setSelectedRecipients([]);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Error al enviar la notificación');
    } finally {
      setLoading(false);
    }
  };

  const channelOptions = [
    { id: 'email', label: 'Email', icon: Mail, color: 'blue' },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'emerald' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Enviar Notificación a Socios</h2>
        <p className="text-slate-600">Comunícate directamente con tus socios activos</p>
        {availableRecipients.length > 0 && (
          <p className="text-sm text-slate-500 mt-1">
            {availableRecipients.length} socio{availableRecipients.length !== 1 ? 's' : ''} activo{availableRecipients.length !== 1 ? 's' : ''} disponible{availableRecipients.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Warning if no active socios */}
      {availableRecipients.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">No hay socios activos</h3>
          <p className="text-amber-700 mb-4">
            Necesitas tener socios activos para poder enviar notificaciones.
          </p>
          <p className="text-sm text-amber-600">
            Ve a la pestaña &quot;Socios&quot; para agregar o activar socios.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Nueva promoción disponible"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Mensaje *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Escribe tu mensaje aquí..."
              required
            />
            <div className="text-xs text-slate-500 mt-1">
              {formData.message.length}/500 caracteres
            </div>
          </div>

          {/* Channels */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Canales de Envío *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {channelOptions.map((channel) => (
                <label
                  key={channel.id}
                  className={`flex items-center gap-4 p-6 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.channels.includes(channel.id)
                      ? `border-${channel.color}-500 bg-${channel.color}-50`
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.channels.includes(channel.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          channels: [...formData.channels, channel.id]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          channels: formData.channels.filter(c => c !== channel.id)
                        });
                      }
                    }}
                    className="sr-only"
                  />
                  <div className={`w-12 h-12 bg-${channel.color}-100 rounded-xl flex items-center justify-center`}>
                    <channel.icon className={`w-6 h-6 text-${channel.color}-600`} />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">{channel.label}</span>
                    <p className="text-sm text-slate-600">
                      {channel.id === 'email' ? 'Envío por correo electrónico' : 'Envío por WhatsApp Business'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Destinatarios
            </label>
            <div className="space-y-4">
              <select
                value={formData.recipients}
                onChange={(e) => {
                  setFormData({ ...formData, recipients: e.target.value });
                  if (e.target.value !== 'specific') {
                    setSelectedRecipients([]);
                  }
                }}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={availableRecipients.length === 0}
              >
                <option value="all">
                  Todos los socios activos ({availableRecipients.length})
                </option>
                <option value="specific">Seleccionar específicos</option>
              </select>

              {/* Specific Recipients Selector */}
              {formData.recipients === 'specific' && (
                <RecipientSelector
                  selectedRecipients={selectedRecipients}
                  onRecipientsChange={setSelectedRecipients}
                />
              )}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Prioridad
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Baja</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
            </select>
          </div>

          {/* Action Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading || availableRecipients.length === 0}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar Notificación
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// History Component
const NotificationHistory = () => {
  const { notifications, loading } = useSimpleNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState<'all' | SimpleNotificationChannel>('all');

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || notification.channels?.includes(channelFilter as SimpleNotificationChannel);
    
    return matchesSearch && matchesStatus && matchesChannel;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'sending': return <Clock className="w-4 h-4 text-orange-500" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      sent: 'bg-emerald-100 text-emerald-700',
      failed: 'bg-red-100 text-red-700',
      sending: 'bg-orange-100 text-orange-700',
      pending: 'bg-blue-100 text-blue-700'
    };
    
    return styles[status as keyof typeof styles] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Historial de Notificaciones</h2>
          <p className="text-slate-600">Revisa todas las notificaciones enviadas a tus socios</p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors">
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">Exportar</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar notificaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="sent">Enviadas</option>
            <option value="sending">Enviando</option>
            <option value="failed">Fallidas</option>
          </select>
          
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as 'all' | SimpleNotificationChannel)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los canales</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtros</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay notificaciones</h3>
            <p className="text-slate-600">No se encontraron notificaciones con los filtros aplicados</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(notification.status)}`}>
                        {notification.status}
                      </span>
                    </div>
                    
                    <p className="text-slate-600 mb-3 line-clamp-2">{notification.message}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(notification.createdAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {notification.recipientIds?.length || 0} destinatario{(notification.recipientIds?.length || 0) !== 1 ? 's' : ''}
                      </div>
                      
                      {notification.channels && (
                        <div className="flex items-center gap-2">
                          {notification.channels.map((channel: string) => (
                            <div key={channel} className="flex items-center gap-1">
                              {channel === 'email' && <Mail className="w-3 h-3" />}
                              {channel === 'whatsapp' && <MessageSquare className="w-3 h-3" />}
                              <span className="capitalize">{channel}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(notification.status)}
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
export default function ComercioNotificationsCenter() {
  const { notifications, loading } = useSimpleNotifications();
  const { clientes } = useClientes();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Calculate stats
  const stats: NotificationStats = {
    total: notifications.length,
    sent: notifications.filter(n => n.status === 'sent').length,
    pending: notifications.filter(n => n.status === 'sending').length,
    failed: notifications.filter(n => n.status === 'failed').length,
    todayCount: notifications.filter(n => {
      const today = new Date();
      const notificationDate = new Date(n.createdAt);
      return notificationDate.toDateString() === today.toDateString();
    }).length,
    weekCount: notifications.filter(n => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(n.createdAt) >= weekAgo;
    }).length,
    successRate: notifications.length > 0 ? Math.round((notifications.filter(n => n.status === 'sent').length / notifications.length) * 100) : 0
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} />;
      case 'enviar':
        return <SendNotification />;
      case 'historial':
        return <NotificationHistory />;
      default:
        return <Dashboard stats={stats} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Cargando centro de notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Centro de Notificaciones</h1>
              <p className="text-slate-600">Comunícate efectivamente con tus socios</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
              <Store className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {clientes.filter(c => c.estado === 'activo').length} socios activos
              </span>
            </div>
            
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Sistema Activo</span>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-semibold transition-all ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg scale-105`
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100'
              }`}>
                <tab.icon className={`w-5 h-5 ${
                  activeTab === tab.id ? 'text-white' : 'text-slate-600'
                }`} />
              </div>
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}