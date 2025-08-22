'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Mail,
  Smartphone,
  Bell,
  Users,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface Notification {
  status: 'sent' | 'failed' | 'sending';
  // Add other properties as needed
}

interface Recipient {
  email?: string;
  phone?: string;
  // Add other properties as needed
}

interface DeliveryStatsProps {
  notifications: Notification[];
  recipients: Recipient[];
}

export const DeliveryStats = ({ notifications, recipients }: DeliveryStatsProps) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Calculate delivery stats
  const deliveryStats = {
    totalSent: notifications.filter(n => n.status === 'sent').length,
    totalFailed: notifications.filter(n => n.status === 'failed').length,
    totalPending: notifications.filter(n => n.status === 'sending').length,
    successRate: notifications.length > 0 
      ? (notifications.filter(n => n.status === 'sent').length / notifications.length) * 100 
      : 0
  };

  // Channel distribution data
  const channelData = [
    {
      name: 'Email',
      value: recipients.filter(r => r.email).length,
      color: '#3B82F6',
      icon: Mail
    },
    {
      name: 'WhatsApp',
      value: recipients.filter(r => r.phone).length,
      color: '#10B981',
      icon: Smartphone
    },
    {
      name: 'In-App',
      value: recipients.length,
      color: '#8B5CF6',
      icon: Bell
    }
  ];

  // Weekly delivery trend (mock data - would be calculated from real data)
  const weeklyTrend = [
    { day: 'Lun', sent: 12, failed: 2 },
    { day: 'Mar', sent: 19, failed: 1 },
    { day: 'Mié', sent: 15, failed: 3 },
    { day: 'Jue', sent: 22, failed: 1 },
    { day: 'Vie', sent: 18, failed: 2 },
    { day: 'Sáb', sent: 8, failed: 0 },
    { day: 'Dom', sent: 5, failed: 1 }
  ];

  // Hourly activity (mock data)
  const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    activity: Math.floor(Math.random() * 20) + 1
  }));

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Enviadas"
          value={deliveryStats.totalSent}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-100"
          trend={+12}
        />
        <StatCard
          title="Fallidas"
          value={deliveryStats.totalFailed}
          icon={XCircle}
          color="text-red-600"
          bgColor="bg-red-100"
          trend={-5}
        />
        <StatCard
          title="Pendientes"
          value={deliveryStats.totalPending}
          icon={Clock}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
          trend={0}
        />
        <StatCard
          title="Tasa de Éxito"
          value={`${deliveryStats.successRate.toFixed(1)}%`}
          icon={TrendingUp}
          color="text-blue-600"
          bgColor="bg-blue-100"
          trend={+3}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Delivery Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Tendencia Semanal</h3>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="sent" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Channel Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribución por Canal</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {channelData.map((channel, index) => {
              const Icon = channel.icon;
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: channel.color }}
                    />
                    <Icon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{channel.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{channel.value}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Hourly Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Actividad por Hora</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={hourlyActivity}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => `${value}:00`}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              labelFormatter={(value) => `${value}:00`}
            />
            <Line 
              type="monotone" 
              dataKey="activity" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Métricas de Rendimiento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Tiempo Promedio de Entrega"
            value="2.3s"
            description="Tiempo desde envío hasta entrega"
            icon={Clock}
            trend={-0.5}
          />
          <MetricCard
            title="Tasa de Apertura"
            value="68.4%"
            description="Porcentaje de notificaciones abiertas"
            icon={Mail}
            trend={+5.2}
          />
          <MetricCard
            title="Engagement Rate"
            value="24.7%"
            description="Interacciones por notificación"
            icon={Users}
            trend={+2.1}
          />
        </div>
      </motion.div>
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, icon: Icon, color, bgColor, trend }: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  trend: number;
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <div className="flex items-center mt-2">
          {trend > 0 ? (
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          ) : trend < 0 ? (
            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
          ) : (
            <div className="w-4 h-4 mr-1" />
          )}
          <span className={`text-sm font-medium ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        </div>
      </div>
      <div className={`p-3 rounded-lg ${bgColor}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </motion.div>
);

const MetricCard = ({ title, value, description, icon: Icon, trend }: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  trend: number;
}) => (
  <div className="text-center">
    <div className="flex justify-center mb-3">
      <div className="p-3 bg-blue-100 rounded-lg">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
    </div>
    <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
    <p className="text-2xl font-bold text-blue-600 mt-1">{value}</p>
    <p className="text-sm text-gray-500 mt-1">{description}</p>
    <div className="flex items-center justify-center mt-2">
      {trend > 0 ? (
        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
      ) : (
        <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
      )}
      <span className={`text-sm font-medium ${
        trend > 0 ? 'text-green-600' : 'text-red-600'
      }`}>
        {trend > 0 ? '+' : ''}{trend}%
      </span>
    </div>
  </div>
);

// Export as default as well for compatibility
export default DeliveryStats;