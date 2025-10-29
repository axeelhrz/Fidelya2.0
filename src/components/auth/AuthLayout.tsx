'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backHref?: string;
}

export function AuthLayout({ 
  children, 
  title, 
  subtitle, 
  showBackButton = false, 
  backHref = '/auth/register'
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" />
      <div className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-br from-yellow-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute -bottom-8 left-40 w-72 h-72 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '4s' }} />

      <div className="w-full max-w-md relative z-10">
        {showBackButton && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <Link 
              href={backHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 shadow-sm hover:shadow-md"
            >
              <ArrowLeft size={16} />
              Volver
            </Link>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-block mb-6">
            <motion.div
              className="relative w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              {/* Sparkle Effect */}
              <div className="absolute -top-1 -right-1">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles size={12} className="text-yellow-300" />
                </motion.div>
              </div>
              
              <span className="text-2xl font-bold text-white">F</span>
            </motion.div>
          </Link>
          
          <motion.h1 
            className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {title}
          </motion.h1>
          
          {subtitle && (
            <motion.p 
              className="text-base text-gray-600 mb-6 max-w-sm mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {subtitle}
            </motion.p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative"
        >
          {/* Glass Effect Background */}
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20" />
          
          {/* Content */}
          <div className="relative bg-white/40 backdrop-blur-sm rounded-3xl p-8 md:p-10 shadow-xl border border-white/30">
            {children}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-8"
        >
          <p className="text-xs text-gray-500">
            © 2024 Fidelya. Todos los derechos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  );
}