'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldAlert, Users, Sparkles } from 'lucide-react';

export default function SocioRegisterDisabledPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="scrollable-container bg-gradient-to-br from-sky-50 via-celestial-50 to-sky-100 min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30"></div>

      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-sky-200/40 to-celestial-200/40 rounded-full blur-xl animate-float-gentle"></div>
      <div className="absolute bottom-32 right-32 w-48 h-48 bg-gradient-to-br from-celestial-200/30 to-sky-300/30 rounded-full blur-2xl animate-float-delay"></div>
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-gradient-to-br from-sky-300/35 to-celestial-300/35 rounded-full blur-lg animate-float"></div>
      <div className="absolute top-1/4 right-20 w-16 h-16 bg-gradient-to-br from-celestial-400/40 to-sky-400/40 rounded-full blur-md animate-pulse-glow"></div>
      <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-gradient-to-br from-sky-300/30 to-celestial-400/30 rounded-full blur-lg animate-bounce-slow"></div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className={`mb-8 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Link
            href="/auth/register"
            className="group inline-flex items-center justify-center w-12 h-12 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-110 border border-white/20 hover:bg-white"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:text-slate-800 transition-colors duration-300" />
          </Link>
        </div>

        <div className={`text-center mb-8 transition-all duration-1200 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '0.2s' }}>
          <Link href="/" className="inline-block mb-6 group">
            <div className="relative">
              <div className="flex items-center justify-center space-x-3">
                <div className="relative group">
                  <div className="w-14 h-14 bg-gradient-to-br from-sky-500 via-celestial-500 to-sky-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-12 group-hover:rotate-0 transition-all duration-700 hover:scale-110">
                    <Users className="w-7 h-7 text-white transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-br from-sky-500/30 to-celestial-500/30 rounded-3xl blur-lg animate-pulse-glow"></div>
                  <div className="absolute -top-1 -right-1">
                    <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                    </motion.div>
                  </div>
                </div>
                <div className="relative overflow-visible">
                  <h1 className="text-4xl md:text-5xl font-bold gradient-text font-playfair tracking-tight hover:scale-105 transition-transform duration-500 leading-none py-2">
                    Fidelya
                  </h1>
                </div>
              </div>
            </div>
          </Link>

          <div className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '0.4s' }}>
            <h2 className="text-3xl font-bold text-slate-800 mb-2 font-jakarta">
              Registro de socio deshabilitado
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed font-jakarta max-w-xl mx-auto">
              El auto-registro público de socios ya no está disponible. Las altas de socios solo pueden ser realizadas por asociaciones autorizadas.
            </p>
          </div>
        </div>

        <div className={`relative transition-all duration-1200 ease-out ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`} style={{ transitionDelay: '0.6s' }}>
          <div className="glass-card p-8">
            <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="mt-1"><ShieldAlert className="w-6 h-6 text-amber-600" /></div>
              <div>
                <h3 className="text-amber-800 font-semibold mb-1">Alta de socios por asociaciones</h3>
                <p className="text-amber-800/90 text-sm">
                  Si deseas ser socio, comunícate con tu asociación para que gestione tu alta manualmente o mediante importación.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full border-2 border-sky-300/50 text-slate-700 py-3 px-4 rounded-2xl font-semibold hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50/50 transition-all duration-300"
              >
                Ir a iniciar sesión
              </button>
              <button
                onClick={() => router.push('/auth/register/asociacion')}
                className="w-full bg-gradient-to-r from-sky-500 via-celestial-500 to-sky-600 text-white py-3 px-4 rounded-2xl font-semibold hover:shadow-sky-500/30 transition-all duration-300"
              >
                Soy una asociación
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
