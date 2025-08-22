'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Store, Users, ArrowRight, Star } from 'lucide-react';

interface RoleCardProps {
  role: 'socio' | 'comercio' | 'asociacion';
  title: string;
  description: string;
  href: string;
  popular?: boolean;
}

const roleConfig = {
  socio: {
    icon: Users,
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-600',
    hoverBg: 'hover:bg-indigo-100',
  },
  comercio: {
    icon: Store,
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-600',
    hoverBg: 'hover:bg-purple-100',
  },
  asociacion: {
    icon: Building2,
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-600',
    hoverBg: 'hover:bg-emerald-100',
  },
};

export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  title,
  description,
  href,
  popular = false,
}) => {
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative"
    >
      {/* Popular Badge */}
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full shadow-lg">
            <Star size={12} />
            MÁS POPULAR
          </div>
        </div>
      )}

      <motion.a
        href={href}
        className={`
          block w-full p-6 bg-white border-2 rounded-2xl shadow-lg transition-all duration-200
          ${config.borderColor} ${config.hoverBg}
          hover:shadow-xl hover:scale-105 hover:-translate-y-1
          ${popular ? 'ring-2 ring-indigo-500 ring-opacity-50' : ''}
        `}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Icon */}
        <div className={`w-16 h-16 ${config.bgColor} rounded-2xl flex items-center justify-center mb-4 mx-auto`}>
          <Icon size={32} className={config.textColor} />
        </div>

        {/* Content */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
            {title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            {description}
          </p>

          {/* CTA Button */}
          <div className={`
            inline-flex items-center gap-2 px-6 py-3 ${config.textColor} ${config.bgColor}
            font-semibold text-sm rounded-xl transition-all duration-200
            hover:shadow-md
          `}>
            Seleccionar {title}
            <ArrowRight size={16} />
          </div>
        </div>
      </motion.a>
    </motion.div>
  );
};