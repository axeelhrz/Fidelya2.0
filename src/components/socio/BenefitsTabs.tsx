'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Gift, 
  CheckCircle, 
  DollarSign, 
  TrendingUp, 
  Star,
  Calendar,
  Target,
  Award
} from 'lucide-react';

interface BenefitsTabsProps {
  activeTab: 'disponibles' | 'usados';
  onTabChange: (tab: 'disponibles' | 'usados') => void;
  stats: {
    disponibles: number;
    usados: number;
    ahorroTotal: number;
  };
}

interface TabData {
  id: 'disponibles' | 'usados';
  label: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  description: string;
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  gradient: string;
  delay: number;
}> = ({ icon, label, value, gradient, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
  >
    <div className="flex items-center gap-4">
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
        style={{ background: gradient }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900">
          {value}
        </p>
      </div>
    </div>
  </motion.div>
);

export const BenefitsTabs: React.FC<BenefitsTabsProps> = ({
  activeTab,
  onTabChange,
  stats
}) => {
  const tabs: TabData[] = [
    {
      id: 'disponibles',
      label: 'Disponibles',
      icon: <Gift size={20} />,
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      description: 'Beneficios listos para usar'
    },
    {
      id: 'usados',
      label: 'Usados',
      icon: <CheckCircle size={20} />,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      description: 'Historial de beneficios'
    }
  ];

  const statsData = [
    {
      icon: <Gift size={20} />,
      label: 'Disponibles',
      value: stats.disponibles,
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      delay: 0.1
    },
    {
      icon: <CheckCircle size={20} />,
      label: 'Usados',
      value: stats.usados,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      delay: 0.2
    },
    {
      icon: <DollarSign size={20} />,
      label: 'Total Ahorrado',
      value: `$${stats.ahorroTotal.toLocaleString()}`,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      delay: 0.3
    },
    {
      icon: <TrendingUp size={20} />,
      label: 'Promedio Mensual',
      value: `$${Math.round(stats.ahorroTotal / 3).toLocaleString()}`,
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      delay: 0.4
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Gestiona tus Beneficios
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Descubre beneficios exclusivos y mantén un registro de tus ahorros
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex bg-gray-100 rounded-2xl p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300
                ${activeTab === tab.id 
                  ? 'text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }
              `}
              style={{
                background: activeTab === tab.id ? tab.gradient : 'transparent'
              }}
            >
              {/* Background for active tab */}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: tab.gradient }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              {/* Content */}
              <div className="relative z-10 flex items-center gap-3">
                {tab.icon}
                <div className="text-left">
                  <div className="font-bold">{tab.label}</div>
                  <div className={`text-xs ${activeTab === tab.id ? 'text-white/80' : 'text-gray-500'}`}>
                    {tab.description}
                  </div>
                </div>
                
                {/* Badge */}
                <div className={`
                  px-2 py-1 rounded-full text-xs font-bold
                  ${activeTab === tab.id 
                    ? 'bg-white/20 text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {tab.id === 'disponibles' ? stats.disponibles : stats.usados}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 text-sm text-gray-600"
        >
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>Última actualización: Hoy</span>
          </div>
          <div className="flex items-center gap-2">
            <Star size={16} className="text-amber-500" />
            <span>Socio Premium</span>
          </div>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Target size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Progreso Mensual</h3>
              <p className="text-sm text-gray-600">Meta: 10 beneficios usados</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{stats.usados}/10</p>
            <p className="text-sm text-gray-500">Este mes</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((stats.usados / 10) * 100, 100)}%` }}
            transition={{ duration: 1, delay: 0.6 }}
            className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full"
          />
        </div>

        {/* Achievements */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-amber-500" />
            <span className="text-sm font-medium text-gray-700">
              {stats.usados >= 10 ? '¡Meta alcanzada!' : `${10 - stats.usados} beneficios para la meta`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                className={`${i < Math.floor(stats.usados / 2) ? 'text-amber-500' : 'text-gray-300'}`}
                fill={i < Math.floor(stats.usados / 2) ? 'currentColor' : 'none'}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};