'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [currentText, setCurrentText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  
  const fullText = 'disfruta.';
  
  useEffect(() => {
    // Trigger visibility for staggered animations
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < fullText.length) {
        setCurrentText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typingInterval);
      }
    }, 120);

    return () => clearInterval(typingInterval);
  }, []);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className="scrollable-container bg-gradient-to-br from-sky-50 via-celestial-50 to-sky-100 min-h-screen relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 bg-grid opacity-30"></div>
      
      {/* More dynamic floating geometric shapes */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-sky-200/40 to-celestial-200/40 rounded-full blur-xl animate-float-gentle"></div>
      <div className="absolute bottom-32 right-32 w-48 h-48 bg-gradient-to-br from-celestial-200/30 to-sky-300/30 rounded-full blur-2xl animate-float-delay"></div>
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-gradient-to-br from-sky-300/35 to-celestial-300/35 rounded-full blur-lg animate-float"></div>
      <div className="absolute top-1/4 right-20 w-16 h-16 bg-gradient-to-br from-celestial-400/40 to-sky-400/40 rounded-full blur-md animate-pulse-glow"></div>
      <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-gradient-to-br from-sky-300/30 to-celestial-400/30 rounded-full blur-lg animate-bounce-slow"></div>
      
      {/* Main content container */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 text-center py-20">
        
        {/* Logo and brand section with enhanced entrance and fixed overflow */}
        <div className={`mb-12 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
          <div className="flex items-center justify-center space-x-4 mb-6">
            {/* Enhanced logo icon with more dynamic effects */}
            <div className="relative group">
              <div className="w-20 h-20 bg-gradient-to-br from-sky-500 via-celestial-500 to-sky-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-12 group-hover:rotate-0 transition-all duration-700 hover:scale-110">
                <svg 
                  className="w-10 h-10 text-white transition-transform duration-500 group-hover:scale-110" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div className="absolute -inset-2 bg-gradient-to-br from-sky-500/30 to-celestial-500/30 rounded-3xl blur-lg animate-pulse-glow"></div>
              <div className="absolute -inset-4 bg-gradient-to-br from-sky-400/20 to-celestial-400/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            </div>
            
            {/* Enhanced brand name with fixed overflow and proper spacing */}
            <div className="relative overflow-visible">
              <h1 className="text-6xl md:text-8xl font-bold gradient-text font-playfair tracking-tight hover:scale-105 transition-transform duration-500 leading-none py-4">
                Fidelya
              </h1>
            </div>
          </div>
        </div>

        {/* Enhanced typewriter effect section with smaller text */}
        <div className={`mb-16 transition-all duration-1200 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '0.3s' }}>
          <div className="h-16 flex items-center justify-center">
            <h2 className="text-2xl md:text-4xl text-slate-700 font-medium font-jakarta relative leading-relaxed">
              <span className="inline-block">
                {currentText}
              </span>
              <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100 text-sky-500 ml-1 animate-pulse`}>
                |
              </span>
            </h2>
          </div>
        </div>

        {/* Enhanced description with staggered animation */}
        <div className={`mb-16 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '0.6s' }}>
          <p className="text-2xl md:text-3xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-jakarta text-balance">
            La plataforma de beneficios que conecta 
            <span className="gradient-text font-semibold hover:scale-105 inline-block transition-transform duration-300"> asociaciones</span>, 
            <span className="gradient-text font-semibold hover:scale-105 inline-block transition-transform duration-300"> socios</span> y 
            <span className="gradient-text font-semibold hover:scale-105 inline-block transition-transform duration-300"> comercios</span>
          </p>
        </div>

        {/* Enhanced CTA buttons with more dynamic animations */}
        <div className={`mb-16 transition-all duration-1200 ease-out ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`} style={{ transitionDelay: '0.9s' }}>
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
            <Link href="/auth/register" className="group">
              <button className="relative overflow-hidden bg-gradient-to-r from-sky-500 via-celestial-500 to-sky-600 text-white px-12 py-5 rounded-2xl font-semibold text-xl shadow-2xl hover:shadow-sky-500/40 transform hover:-translate-y-3 hover:scale-110 transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-sky-500/50 min-w-[280px] before:absolute before:inset-0 before:bg-gradient-to-r before:from-sky-600 before:via-celestial-600 before:to-sky-700 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100">
                <span className="relative z-10">Registrarse ahora</span>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-celestial-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
              </button>
            </Link>
            
            <Link href="/auth/login" className="group">
              <button className="relative overflow-hidden bg-white/90 backdrop-blur-sm border-2 border-sky-300/50 text-slate-700 px-12 py-5 rounded-2xl font-semibold text-xl shadow-xl hover:shadow-2xl hover:bg-white hover:border-sky-400 transform hover:-translate-y-3 hover:scale-110 transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-sky-500/50 min-w-[280px]">
                <span className="relative z-10">Iniciar sesión</span>
                <div className="absolute inset-0 bg-gradient-to-r from-sky-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-sky-300 to-celestial-300 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              </button>
            </Link>
          </div>
        </div>

        {/* Enhanced role information with improved animations */}
        <div className={`mb-20 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '1.2s' }}>
          <div className="glass-card max-w-2xl mx-auto p-8 hover:scale-105 transition-all duration-500">
            <p className="text-xl text-slate-600 mb-6 font-jakarta">
              Accede según tu rol:
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <div className="flex items-center space-x-3 bg-gradient-to-r from-sky-50 to-celestial-50 px-6 py-3 rounded-xl border border-sky-200/50 hover:scale-105 hover:shadow-lg transition-all duration-300 group">
                <div className="w-3 h-3 bg-gradient-to-r from-sky-500 to-celestial-500 rounded-full group-hover:animate-pulse"></div>
                <span className="font-semibold text-slate-700 text-lg">Asociación</span>
              </div>
              <div className="flex items-center space-x-3 bg-gradient-to-r from-celestial-50 to-sky-50 px-6 py-3 rounded-xl border border-celestial-200/50 hover:scale-105 hover:shadow-lg transition-all duration-300 group">
                <div className="w-3 h-3 bg-gradient-to-r from-celestial-500 to-sky-500 rounded-full group-hover:animate-pulse"></div>
                <span className="font-semibold text-slate-700 text-lg">Comercio</span>
              </div>
              <div className="flex items-center space-x-3 bg-gradient-to-r from-sky-50 to-celestial-100 px-6 py-3 rounded-xl border border-sky-200/50 hover:scale-105 hover:shadow-lg transition-all duration-300 group">
                <div className="w-3 h-3 bg-gradient-to-r from-sky-500 to-celestial-600 rounded-full group-hover:animate-pulse"></div>
                <span className="font-semibold text-slate-700 text-lg">Socio</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced features showcase with staggered entrance */}
        <div className={`mb-20 transition-all duration-1200 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '1.5s' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 with enhanced hover effects */}
            <div className="card-hover text-center group transform hover:scale-105 transition-all duration-500">
              <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-celestial-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg group-hover:shadow-sky-500/30">
                <svg className="w-8 h-8 text-white transition-transform duration-300 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4 font-jakarta group-hover:text-sky-600 transition-colors duration-300">Gestión Inteligente</h3>
              <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors duration-300">Sistema completo para administrar socios, beneficios y validaciones en tiempo real.</p>
            </div>

            {/* Feature 2 with enhanced hover effects */}
            <div className="card-hover text-center group transform hover:scale-105 transition-all duration-500" style={{ transitionDelay: '0.1s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-celestial-500 to-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg group-hover:shadow-celestial-500/30">
                <svg className="w-8 h-8 text-white transition-transform duration-300 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3,11H5V13H3V11M11,5H13V9H11V5M9,11H13V15H9V11M15,11H19V13H15V11M19,5H21V9H19V5M5,5H9V9H5V5M3,19H5V21H3V19M9,19H13V21H9V19M15,19H19V21H15V19"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4 font-jakarta group-hover:text-celestial-600 transition-colors duration-300">Códigos QR</h3>
              <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors duration-300">Validación rápida y segura de beneficios mediante códigos QR únicos y encriptados.</p>
            </div>

            {/* Feature 3 with enhanced hover effects */}
            <div className="card-hover text-center group transform hover:scale-105 transition-all duration-500" style={{ transitionDelay: '0.2s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-sky-600 to-celestial-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg group-hover:shadow-sky-600/30">
                <svg className="w-8 h-8 text-white transition-transform duration-300 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4 font-jakarta group-hover:text-sky-700 transition-colors duration-300">Analytics Avanzados</h3>
              <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors duration-300">Reportes detallados y métricas en tiempo real para optimizar tu programa de fidelización.</p>
            </div>
          </div>
        </div>

        {/* Rest of the content with enhanced animations */}
        <div className={`mb-20 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '1.8s' }}>
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-slate-800 mb-8 font-jakarta">¿Por qué elegir Fidelya?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-sky-200/50 hover:scale-105 hover:bg-white/80 transition-all duration-500 group">
                <h4 className="text-xl font-semibold text-sky-700 mb-4 group-hover:text-sky-600">Fácil de usar</h4>
                <p className="text-slate-600 group-hover:text-slate-700 transition-colors duration-300">Interfaz intuitiva diseñada para que cualquier usuario pueda gestionar su programa de beneficios sin complicaciones.</p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-celestial-200/50 hover:scale-105 hover:bg-white/80 transition-all duration-500 group">
                <h4 className="text-xl font-semibold text-celestial-700 mb-4 group-hover:text-celestial-600">Seguro y confiable</h4>
                <p className="text-slate-600 group-hover:text-slate-700 transition-colors duration-300">Tecnología de encriptación avanzada para proteger los datos de tus socios y transacciones.</p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-sky-200/50 hover:scale-105 hover:bg-white/80 transition-all duration-500 group">
                <h4 className="text-xl font-semibold text-sky-700 mb-4 group-hover:text-sky-600">Escalable</h4>
                <p className="text-slate-600 group-hover:text-slate-700 transition-colors duration-300">Crece con tu negocio. Desde pequeñas asociaciones hasta grandes redes comerciales.</p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-celestial-200/50 hover:scale-105 hover:bg-white/80 transition-all duration-500 group">
                <h4 className="text-xl font-semibold text-celestial-700 mb-4 group-hover:text-celestial-600">Soporte 24/7</h4>
                <p className="text-slate-600 group-hover:text-slate-700 transition-colors duration-300">Equipo de soporte dedicado para ayudarte en cada paso de tu experiencia con Fidelya.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced final call to action */}
        <div className={`transition-all duration-1200 ease-out ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`} style={{ transitionDelay: '2.1s' }}>
          <div className="bg-gradient-to-r from-sky-500/10 to-celestial-500/10 rounded-3xl p-12 border border-sky-200/30 hover:scale-105 transition-all duration-500 group">
            <h3 className="text-3xl font-bold text-slate-800 mb-6 font-jakarta group-hover:text-sky-700 transition-colors duration-300">¿Listo para comenzar?</h3>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto group-hover:text-slate-700 transition-colors duration-300">
              Únete a cientos de asociaciones y comercios que ya confían en Fidelya para gestionar sus programas de beneficios.
            </p>
            <Link href="/auth/register">
              <button className="bg-gradient-to-r from-sky-500 to-celestial-500 text-white px-10 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-sky-500/40 transform hover:-translate-y-2 hover:scale-110 transition-all duration-500 relative overflow-hidden group">
                <span className="relative z-10">Comenzar gratis</span>
                <div className="absolute inset-0 bg-gradient-to-r from-sky-600 to-celestial-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Enhanced scroll to top button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-gradient-to-r from-sky-500 to-celestial-500 text-white p-3 rounded-full shadow-lg hover:shadow-sky-500/40 transform hover:-translate-y-2 hover:scale-110 transition-all duration-500 group relative overflow-hidden"
        >
          <svg className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
          </svg>
          <div className="absolute inset-0 bg-gradient-to-r from-sky-600 to-celestial-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </div>
    </div>
  );
}