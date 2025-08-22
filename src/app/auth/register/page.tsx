'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Building2, 
  Store, 
  User, 
  ArrowRight, 
  LogIn, 
  Zap,
  Star,
  Shield,
  Users
} from 'lucide-react';

const RegisterPage = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger visibility for staggered animations
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const roles = [
    {
      id: 'asociacion',
      title: 'Asociación',
      description: 'Gestiona programas de fidelidad y conecta con múltiples comercios',
      icon: Building2,
      color: '#0ea5e9',
      bgGradient: 'from-sky-500 to-celestial-600',
      bgColor: 'bg-sky-50',
      textColor: 'text-sky-600',
      borderColor: 'border-sky-200',
      href: '/auth/register/asociacion',
      features: ['Panel administrativo', 'Gestión de comercios', 'Reportes avanzados']
    },
    {
      id: 'socio',
      title: 'Socio',
      description: 'Accede a beneficios exclusivos y descuentos especiales',
      icon: User,
      color: '#3498db',
      bgGradient: 'from-celestial-500 to-sky-600',
      bgColor: 'bg-celestial-50',
      textColor: 'text-celestial-600',
      borderColor: 'border-celestial-200',
      href: '/auth/register/socio',
      features: ['Beneficios exclusivos', 'Descuentos especiales', 'Programa de puntos']
    },
    {
      id: 'comercio',
      title: 'Comercio',
      description: 'Atrae y fideliza clientes con programas de recompensas',
      icon: Store,
      color: '#2980b9',
      bgGradient: 'from-sky-600 to-celestial-700',
      bgColor: 'bg-sky-100',
      textColor: 'text-sky-700',
      borderColor: 'border-sky-300',
      href: '/auth/register/comercio',
      features: ['Gestión de clientes', 'Programas de recompensas', 'Analytics detallados']
    },
  ];

  const benefits = [
    { icon: Shield, text: 'Seguro y confiable', color: 'text-sky-600' },
    { icon: Users, text: 'Comunidad activa', color: 'text-celestial-600' },
    { icon: Star, text: 'Beneficios únicos', color: 'text-sky-700' },
  ];

  return (
    <div className="scrollable-container bg-gradient-to-br from-sky-50 via-celestial-50 to-sky-100 min-h-screen relative overflow-hidden">
      {/* Enhanced animated background elements - matching homepage */}
      <div className="absolute inset-0 bg-grid opacity-30"></div>
      
      {/* More dynamic floating geometric shapes */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-sky-200/40 to-celestial-200/40 rounded-full blur-xl animate-float-gentle"></div>
      <div className="absolute bottom-32 right-32 w-48 h-48 bg-gradient-to-br from-celestial-200/30 to-sky-300/30 rounded-full blur-2xl animate-float-delay"></div>
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-gradient-to-br from-sky-300/35 to-celestial-300/35 rounded-full blur-lg animate-float"></div>
      <div className="absolute top-1/4 right-20 w-16 h-16 bg-gradient-to-br from-celestial-400/40 to-sky-400/40 rounded-full blur-md animate-pulse-glow"></div>
      <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-gradient-to-br from-sky-300/30 to-celestial-400/30 rounded-full blur-lg animate-bounce-slow"></div>
      <div className="absolute top-3/4 right-1/4 w-28 h-28 bg-gradient-to-br from-sky-400/25 to-celestial-300/25 rounded-full blur-xl animate-float-gentle"></div>

      {/* Enhanced Back Button */}
      <div className={`absolute top-8 left-8 z-20 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <Link
          href="/"
          className="group inline-flex items-center justify-center w-12 h-12 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-110 border border-white/20 hover:bg-white"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:text-slate-800 transition-colors duration-300" />
        </Link>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-2xl">
          {/* Enhanced Header */}
          <div className={`text-center mb-12 transition-all duration-1200 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Enhanced Logo - matching homepage style */}
            <Link href="/" className="inline-block mb-8 group">
              <div className="relative">
                <div className="flex items-center justify-center space-x-4">
                  <div className="relative group">
                    <div className="w-16 h-16 bg-gradient-to-br from-sky-500 via-celestial-500 to-sky-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-12 group-hover:rotate-0 transition-all duration-700 hover:scale-110">
                      <Zap className="w-8 h-8 text-white transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div className="absolute -inset-2 bg-gradient-to-br from-sky-500/30 to-celestial-500/30 rounded-3xl blur-lg animate-pulse-glow"></div>
                    <div className="absolute -inset-4 bg-gradient-to-br from-sky-400/20 to-celestial-400/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  </div>
                  
                  {/* Enhanced brand name with fixed overflow and proper spacing */}
                  <div className="relative overflow-visible">
                    <h1 className="text-5xl md:text-6xl font-bold gradient-text font-playfair tracking-tight hover:scale-105 transition-transform duration-500 leading-none py-2">
                      Fidelya
                    </h1>
                  </div>
                </div>
              </div>
            </Link>

            <div className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '0.2s' }}>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4 font-jakarta">
                <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Únete a{' '}
                </span>
                <span className="gradient-text">
                  Fidelya
                </span>
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed max-w-lg mx-auto font-jakarta">
                Selecciona tu perfil y comienza a disfrutar de beneficios únicos en nuestro ecosistema de fidelización
              </p>
            </div>
          </div>

          {/* Enhanced Role Cards Container */}
          <div className={`relative transition-all duration-1200 ease-out ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`} style={{ transitionDelay: '0.4s' }}>
            {/* Glass effect background - matching homepage style */}
            <div className="glass-card p-8 hover:scale-105 transition-all duration-500">
              {/* Role Cards */}
              <div className="space-y-4 mb-8">
                {roles.map((role, index) => (
                  <div
                    key={role.id}
                    className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
                    style={{ transitionDelay: `${0.6 + index * 0.1}s` }}
                  >
                    <Link
                      href={role.href}
                      className="block group"
                      onMouseEnter={() => setHoveredCard(role.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <div className={`relative p-6 rounded-2xl border-2 transition-all duration-500 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transform hover:scale-105 ${
                        hoveredCard === role.id 
                          ? `${role.borderColor} -translate-y-2 shadow-2xl` 
                          : 'border-slate-200 hover:border-sky-300'
                      }`}>
                        {/* Top accent bar */}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${role.bgGradient} rounded-t-2xl transition-opacity duration-300 ${
                          hoveredCard === role.id ? 'opacity-100' : 'opacity-0'
                        }`} />

                        <div className="flex items-center space-x-4">
                          {/* Enhanced Icon */}
                          <div className={`relative w-16 h-16 rounded-2xl ${role.bgColor} flex items-center justify-center transition-all duration-500 shadow-lg ${
                            hoveredCard === role.id ? 'scale-125 shadow-xl' : 'hover:scale-110'
                          }`}>
                            <role.icon className={`w-7 h-7 ${role.textColor} transition-transform duration-300 ${hoveredCard === role.id ? 'scale-110' : ''}`} />
                            {hoveredCard === role.id && (
                              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-100 transition-opacity duration-300" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <h3 className={`text-xl font-bold text-slate-800 mb-1 transition-colors duration-300 font-jakarta ${
                              hoveredCard === role.id ? role.textColor : 'group-hover:text-slate-900'
                            }`}>
                              {role.title}
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed mb-2 font-jakarta group-hover:text-slate-700 transition-colors duration-300">
                              {role.description}
                            </p>
                            
                            {/* Features */}
                            <div className="flex flex-wrap gap-2">
                              {role.features.map((feature, idx) => (
                                <span
                                  key={idx}
                                  className={`text-xs px-2 py-1 rounded-full ${role.bgColor} ${role.textColor} font-medium transition-all duration-300 hover:scale-105`}
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Enhanced Arrow */}
                          <div className={`transition-all duration-500 ${
                            hoveredCard === role.id 
                              ? `${role.textColor} transform translate-x-2 scale-110` 
                              : 'text-slate-400 group-hover:text-slate-600'
                          }`}>
                            <ArrowRight className="w-6 h-6" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              {/* Benefits Section */}
              <div className={`mb-8 p-5 bg-slate-50/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '1s' }}>
                <div className="flex justify-around items-center">
                  {benefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="text-center group"
                      style={{ 
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                        transition: `all 0.5s ease-out ${1.2 + index * 0.1}s`
                      }}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-2 mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                        <benefit.icon className={`w-5 h-5 ${benefit.color}`} />
                      </div>
                      <p className="text-xs text-slate-600 font-semibold font-jakarta">{benefit.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enhanced Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white/80 backdrop-blur-sm text-slate-500 font-semibold text-sm rounded-full border border-slate-200 font-jakarta">
                    ¿Ya tienes cuenta?
                  </span>
                </div>
              </div>

              {/* Enhanced Login Button */}
              <div className={`transition-all duration-1200 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '1.4s' }}>
                <Link href="/auth/login">
                  <button className="w-full border-2 border-sky-300/50 text-slate-700 py-4 px-6 rounded-2xl font-semibold text-base hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50/50 transition-all duration-500 transform hover:-translate-y-1 hover:scale-105 flex items-center justify-center space-x-3 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl font-jakarta">
                    <LogIn className="w-5 h-5" />
                    <span>Iniciar sesión</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;