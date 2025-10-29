'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Building2, 
  Gift, 
  Star, 
  Info,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Heart
} from 'lucide-react';

interface BenefitsSourceInfoProps {
  className?: string;
}

export const BenefitsSourceInfo: React.FC<BenefitsSourceInfoProps> = ({ 
  className = '' 
}) => {
  const sources = [
    {
      icon: Users,
      title: 'Tu Asociación',
      description: 'Beneficios exclusivos creados específicamente para los miembros de tu asociación',
      color: 'purple',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      iconBg: 'bg-gradient-to-r from-purple-500 to-purple-600',
      features: ['Exclusivos para miembros', 'Descuentos especiales', 'Renovación automática']
    },
    {
      icon: Building2,
      title: 'Comercios Vinculados',
      description: 'Ofertas especiales de comercios que están afiliados a tu asociación',
      color: 'blue',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      iconBg: 'bg-gradient-to-r from-blue-500 to-blue-600',
      features: ['Red de comercios afiliados', 'Ofertas negociadas', 'Calidad garantizada']
    },
    {
      icon: Gift,
      title: 'Beneficios Públicos',
      description: 'Ofertas disponibles para todos los usuarios, sin restricciones de membresía',
      color: 'orange',
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      iconBg: 'bg-gradient-to-r from-orange-500 to-orange-600',
      features: ['Acceso libre', 'Variedad de opciones', 'Siempre disponibles']
    },
    {
      icon: Star,
      title: 'Acceso Directo',
      description: 'Beneficios especiales con acceso inmediato, sin necesidad de validaciones',
      color: 'yellow',
      bgColor: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200',
      iconBg: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      features: ['Uso inmediato', 'Sin restricciones', 'Máxima flexibilidad']
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: 'Seguridad Garantizada',
      description: 'Todos los beneficios están verificados y son seguros de usar'
    },
    {
      icon: Zap,
      title: 'Actualización Automática',
      description: 'Nuevos beneficios se agregan automáticamente a tu cuenta'
    },
    {
      icon: Heart,
      title: 'Personalizado para Ti',
      description: 'Los beneficios se adaptan a tu perfil y preferencias'
    }
  ];

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Main Info Card */}
      <motion.div 
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center space-x-4 mb-8">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
            <Info className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Fuentes de tus Beneficios
            </h3>
            <p className="text-gray-600 font-medium">
              Conoce de dónde provienen las ofertas disponibles para ti
            </p>
          </div>
        </div>

        {/* Sources Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {sources.map((source, index) => (
            <motion.div
              key={source.title}
              className={`${source.bgColor} ${source.borderColor} border-2 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <div className="flex items-start space-x-4 mb-4">
                <div className={`p-3 ${source.iconBg} rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
                  <source.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-purple-600 transition-colors">
                    {source.title}
                  </h4>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {source.description}
                  </p>
                  
                  {/* Features */}
                  <div className="space-y-2">
                    {source.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              whileHover={{ y: -2 }}
            >
              <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <benefit.icon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">{benefit.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Auto Update Info */}
        <motion.div 
          className="p-6 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 rounded-2xl border-2 border-green-200"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-green-500 rounded-xl shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Actualización Automática
              </h4>
              <p className="text-green-800 leading-relaxed">
                Tus beneficios se actualizan automáticamente según tu membresía y las afiliaciones 
                de tu asociación. No necesitas hacer nada adicional para acceder a nuevas ofertas.
              </p>
              
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700">Sincronización en tiempo real</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700">Notificaciones de nuevos beneficios</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700">Gestión automática de vencimientos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700">Acceso inmediato a ofertas</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <button className="inline-flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            <span>Ver más información sobre membresías</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </motion.div>

      {/* Tips Card */}
      <motion.div 
        className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 rounded-2xl border-2 border-purple-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h4 className="font-bold text-purple-900">💡 Tips para maximizar tus beneficios</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">1</div>
              <p className="text-sm text-purple-800">Revisa regularmente los beneficios disponibles</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">2</div>
              <p className="text-sm text-purple-800">Usa los filtros para encontrar ofertas específicas</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">3</div>
              <p className="text-sm text-purple-800">Verifica las fechas de vencimiento</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">4</div>
              <p className="text-sm text-purple-800">Comparte beneficios públicos con amigos</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};