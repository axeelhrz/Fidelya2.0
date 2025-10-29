'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Send,
  History,
  BarChart3,
  Users,
  MessageSquare,
  Mail,
  TrendingUp,
  TrendingDown,
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
  Gift,
  Megaphone,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useSocios } from '@/hooks/useSocios';
import { useAuth } from '@/hooks/useAuth';
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

/**
 * Activity item used by the Dashboard recentActivity.
 * Adjusted: removed index signature from notification so stricter backend Notification type is assignable.
 */
interface NotificationActivity {
  time: string;
  action: string;
  count: number;
  status: 'success' | 'error' | 'pending' | 'info' | string;
  notification?: {
    title?: string;
    createdAt?: string | Date;
  } | null;
  title?: string;
  date?: string;
}

type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'benefit';
type PriorityType = 'low' | 'normal' | 'high' | 'urgent';

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
  const { allNotifications } = useNotifications();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('7d');
  
  const statCards = [
    {
      title: 'Total Enviadas',
      value: stats.total,
      change: '+12%',
      trend: 'up',
      icon: Bell,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Exitosas',
      value: stats.sent,
      change: '+8%',
      trend: 'up',
      icon: CheckCircle,
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600'
    },
    {
      title: 'Tasa de Éxito',
      value: `${stats.successRate}%`,
      change: '+2%',
      trend: 'up',
      icon: Target,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Esta Semana',
      value: stats.weekCount,
      change: '+15%',
      trend: 'up',
      icon: Calendar,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600'
    }
  ];

  const channelStats = [
    { name: 'WhatsApp', count: Math.floor(stats.sent * 0.7), color: 'emerald', icon: MessageSquare },
    { name: 'Email', count: Math.floor(stats.sent * 0.3), color: 'blue', icon: Mail }
  ];

  // Obtener actividad reciente real del comercio actual
  const getRecentActivity = () => {
    if (!user || !allNotifications.length) {
      return [
        {
          time: '--:--',
          action: 'No hay actividad reciente',
          count: 0,
          status: 'info',
          notification: null,
          date: undefined
        }
      ];
    }

    // Filtrar notificaciones del comercio actual y ordenar por fecha
    const userNotifications = allNotifications
      .filter(notification => notification.senderId === user.uid)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5); // Últimas 5 actividades
    if (userNotifications.length === 0) {
      return [
        {
          time: '--:--',
          action: 'Aún no has enviado notificaciones',
          count: 0,
          status: 'info',
          notification: null,
          date: undefined
        }
      ];
    }

    return userNotifications.map(notification => {
      const date = new Date(notification.createdAt);
      const time = date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      // Determinar el tipo de acción basado en el tipo de notificación
      let action = '';
      switch (notification.type) {
        case 'benefit':
          action = 'Promoción enviada';
          break;
        case 'info':
          action = 'Información enviada';
          break;
        case 'success':
          action = 'Confirmación enviada';
          break;
        case 'warning':
          action = 'Advertencia enviada';
          break;
        case 'error':
          action = 'Alerta enviada';
          break;
        default:
          action = 'Notificación enviada';
      }

      // Si el título contiene palabras clave, personalizar la acción
      const title = notification.title.toLowerCase();
      if (title.includes('promoción') || title.includes('oferta') || title.includes('descuento')) {
        action = 'Promoción enviada';
      } else if (title.includes('recordatorio')) {
        action = 'Recordatorio enviado';
      } else if (title.includes('bienvenida') || title.includes('bienvenido')) {
        action = 'Mensaje de bienvenida';
      } else if (title.includes('evento')) {
        action = 'Invitación a evento';
      }

      return {
        time,
        action,
        count: notification.recipientCount || 1,
        status: notification.status === 'sent' ? 'success' : 
                notification.status === 'failed' ? 'error' : 'pending',
        notification,
        title: notification.title,
        date: date.toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: '2-digit' 
        })
      };
    });
  };

  const recentActivity = getRecentActivity();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Dashboard de Notificaciones</h2>
          <p className="text-slate-600">Monitorea el rendimiento de tus comunicaciones con clientes</p>
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
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                stat.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.change}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Activity Timeline - MEJORADO */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Tu Actividad Reciente</h3>
            {user && (
              <div className="text-sm text-slate-500">
                {user.nombre || user.email}
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {recentActivity.length === 0 || recentActivity[0].notification === null ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-500 text-sm">
                  {stats.total === 0 
                    ? 'Aún no has enviado notificaciones'
                    : 'No hay actividad reciente'
                  }
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Comienza enviando tu primera notificación
                </p>
              </div>
            ) : (
              recentActivity.map((activity: NotificationActivity, index: number) => (
                <div key={index} className="flex items-start gap-4 group hover:bg-slate-50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                  <div className="flex flex-col items-center">
                    <div className="text-xs text-slate-500 font-medium mb-1">{activity.time}</div>
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'success' ? 'bg-emerald-500' :
                      activity.status === 'error' ? 'bg-red-500' :
                      activity.status === 'pending' ? 'bg-orange-500' :
                      'bg-slate-400'
                    }`} />
                    {activity.date && (
                      <div className="text-xs text-slate-400 mt-1">{activity.date}</div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-700 truncate">
                        {activity.action}
                      </span>
                      <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        activity.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                        activity.status === 'error' ? 'bg-red-100 text-red-700' :
                        activity.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {activity.status === 'success' ? 'Enviado' :
                         activity.status === 'error' ? 'Falló' :
                         activity.status === 'pending' ? 'Pendiente' :
                         'Info'}
                      </div>
                    </div>
                    
                    {(('title' in activity && activity.title) || activity.notification?.title) && (
                      <div className="text-xs text-slate-500 truncate mb-1">
                        &quot;{ 'title' in activity ? activity.title : activity.notification?.title }&quot;
                      </div>
                    )}
                    
                    <div className="text-xs text-slate-400">
                      {activity.count > 0 ? (
                        `${activity.count} destinatario${activity.count !== 1 ? 's' : ''}`
                      ) : (
                        'Sin destinatarios'
                      )}
                    </div>
                  </div>

                  {activity.notification && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                        title="Ver detalles"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Botón para ver más actividad */}
          {recentActivity.length > 0 && recentActivity[0].notification !== null && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button 
                onClick={() => {
                  // Cambiar a la pestaña de historial
                  const event = new CustomEvent('changeTab', { detail: 'historial' });
                  window.dispatchEvent(event);
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Ver historial completo →
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Send Notification Component
const SendNotification = () => {
  const { createNotification } = useNotifications();
  const { socios } = useSocios();
  const [loading, setLoading] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [formData, setFormData] = useState<{
    title: string;
    message: string;
    type: NotificationType;
    priority: PriorityType;
    category: "system" | "membership" | "payment" | "event" | "general";
    channels: string[];
    recipients: string;
    actionUrl: string;
    actionLabel: string;
    tags: string[];
  }>({
    title: '',
    message: '',
    type: 'info',
    priority: 'normal',
    category: 'general',
    channels: ['app'],
    recipients: 'all',
    actionUrl: '',
    actionLabel: '',
    tags: []
  });

  // Convert socios to recipients format
  const availableRecipients: Recipient[] = socios
    .filter(socio => socio.estado === 'activo')
    .map(socio => ({
      id: socio.id,
      name: socio.nombre,
      email: socio.email,
      phone: socio.telefono,
      type: 'socio' as const,
      status: socio.estado
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const recipientIds = formData.recipients === 'specific' 
      ? selectedRecipients.map(r => r.id)
      : availableRecipients.map(r => r.id);

    if (recipientIds.length === 0) {
      toast.error('No hay destinatarios disponibles');
      return;
    }

    setLoading(true);
    try {
      await createNotification({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        priority: formData.priority,
        category: formData.category,
        recipientIds,
        recipientType: 'socio',
        actionUrl: formData.actionUrl || undefined,
        actionLabel: formData.actionLabel || undefined,
        tags: formData.tags,
        channels: formData.channels
      });
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'info',
        priority: 'normal',
        category: 'general',
        channels: ['app'],
        recipients: 'all',
        actionUrl: '',
        actionLabel: '',
        tags: []
      });
      setSelectedRecipients([]);
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Enviar Notificación a Clientes</h2>
        <p className="text-slate-600">Comunícate directamente con tus clientes socios</p>
      </div>

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
              maxLength={500}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Escribe tu mensaje aquí..."
              required
            />
            <div className="text-xs text-slate-500 mt-1">
              {formData.message.length}/500 caracteres
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tipo
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
                  <span className="text-sm font-medium text-slate-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Prioridad
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityType })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
              >
                <option value="all">Todos los clientes socios ({availableRecipients.length})</option>
                <option value="specific">Seleccionar específicos</option>
              </select>

              {formData.recipients === 'specific' && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-700">
                      {selectedRecipients.length} cliente{selectedRecipients.length !== 1 ? 's' : ''} seleccionado{selectedRecipients.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedRecipients([])}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Limpiar todo
                    </button>
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {availableRecipients.map((recipient) => (
                      <label
                        key={recipient.id}
                        className="flex items-center gap-3 p-2 bg-white rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRecipients.some(r => r.id === recipient.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRecipients(prev => [...prev, recipient]);
                            } else {
                              setSelectedRecipients(prev => prev.filter(r => r.id !== recipient.id));
                            }
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{recipient.name}</div>
                          <div className="text-sm text-slate-500">{recipient.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
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
  const { allNotifications, loading } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredNotifications = allNotifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter;
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
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
          <p className="text-slate-600">Revisa todas las notificaciones enviadas a tus clientes</p>
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los tipos</option>
            <option value="info">Información</option>
            <option value="success">Éxito</option>
            <option value="warning">Advertencia</option>
            <option value="error">Error</option>
            <option value="benefit">Beneficio</option>
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
                        1 destinatario
                      </div>
                      
                      {notification.channels && (
                        <div className="flex items-center gap-2">
                          {notification.channels.map((channel: string) => (
                            <div key={channel} className="flex items-center gap-1">
                              {channel === 'email' && <Mail className="w-3 h-3" />}
                              {channel === 'whatsapp' && <MessageSquare className="w-3 h-3" />}
                              {channel === 'app' && <Bell className="w-3 h-3" />}
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
export default function EnhancedNotificationsCenter() {
  const { allNotifications, loading } = useNotifications();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Escuchar evento personalizado para cambiar de pestaña
  useEffect(() => {
    const handleChangeTab = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('changeTab', handleChangeTab as EventListener);
    
    return () => {
      window.removeEventListener('changeTab', handleChangeTab as EventListener);
    };
  }, []);

  // Calculate stats
  const stats: NotificationStats = {
    total: allNotifications.length,
    sent: allNotifications.filter(n => n.status === 'sent').length,
    pending: allNotifications.filter(n => n.status === 'sending').length,
    failed: allNotifications.filter(n => n.status === 'failed').length,
    todayCount: allNotifications.filter(n => {
      const today = new Date();
      const notificationDate = new Date(n.createdAt);
      return notificationDate.toDateString() === today.toDateString();
    }).length,
    weekCount: allNotifications.filter(n => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(n.createdAt) >= weekAgo;
    }).length,
    successRate: allNotifications.length > 0 ? Math.round((allNotifications.filter(n => n.status === 'sent').length / allNotifications.length) * 100) : 0
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
              <p className="text-slate-600">Comunícate efectivamente con tus clientes socios</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Sistema Activo</span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                group relative flex items-center gap-3 px-6 py-3 rounded-2xl font-semibold transition-all
                ${activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg scale-105`
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:scale-102'
                }
              `}
            >
              <div className={`
                w-8 h-8 rounded-xl flex items-center justify-center transition-all
                ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'}
              `}>
                <tab.icon className={`w-5 h-5 ${
                  activeTab === tab.id ? 'text-white' : 'text-slate-600 group-hover:text-slate-700'
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