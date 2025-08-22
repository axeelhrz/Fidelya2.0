'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  UserPlus,
  X,
  Mail,
  Phone,
  User,
  AlertCircle,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocioAsociacion } from '@/hooks/useSocioAsociacion';
import { userSearchService, RegisteredUser } from '@/services/user-search.service';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface VincularSocioDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const VincularSocioDialog: React.FC<VincularSocioDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { vincularSocio, loading: vinculandoSocio } = useSocioAsociacion();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [mounted, setMounted] = useState(false);

  // Asegurar que el componente esté montado
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Efecto para limpiar la búsqueda cuando se abre/cierra el diálogo
  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setUsers([]);
      setError(null);
      setSelectedUser(null);
      console.log('🔄 Dialog opened, cleared state');
    }
  }, [open]);

  // Función para buscar usuarios
  const handleSearch = async () => {
    if (!searchTerm.trim() || !user) {
      console.log('⚠️ Search term empty or no user');
      return;
    }

    try {
      setSearching(true);
      setError(null);
      console.log('🔍 Starting search with term:', searchTerm);
      console.log('👤 Current user:', { uid: user.uid, role: user.role });

      const trimmedSearchTerm = searchTerm.trim();
      let result: { users: RegisteredUser[] };

      // Detectar si el término de búsqueda es un DNI (solo números)
      const isDniSearch = /^\d+$/.test(trimmedSearchTerm);
      
      if (isDniSearch) {
        console.log('🔍 Detected DNI search, using specific DNI search function');
        const dniResults = await userSearchService.searchByDni(trimmedSearchTerm, user.uid);
        result = { users: dniResults };
      } else if (trimmedSearchTerm.includes('@')) {
        console.log('🔍 Detected email search, using specific email search function');
        const emailResults = await userSearchService.searchByEmail(trimmedSearchTerm, user.uid);
        result = { users: emailResults };
      } else {
        console.log('🔍 Using general search function');
        // Buscar usuarios que no estén ya vinculados a la asociación
        result = await userSearchService.searchRegisteredUsers({
          search: trimmedSearchTerm,
          role: 'socio', // Buscar específicamente usuarios con role 'socio'
          estado: 'activo',
          excludeAsociacionId: user.uid
        });
      }

      console.log('📊 Search result:', result);
      setUsers(result.users);

      if (result.users.length === 0) {
        const searchType = isDniSearch ? 'DNI' : trimmedSearchTerm.includes('@') ? 'email' : 'término de búsqueda';
        const errorMsg = `No se encontraron usuarios con role "socio" que coincidan con el ${searchType} "${trimmedSearchTerm}"`;
        setError(errorMsg);
        console.log('❌', errorMsg);
      } else {
        console.log(`✅ Found ${result.users.length} users`);
      }
    } catch (err) {
      console.error('❌ Error buscando usuarios:', err);
      const errorMsg = 'Error al buscar usuarios. Revisa la consola para más detalles.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSearching(false);
    }
  };

  // Función para vincular el socio seleccionado
  const handleVincular = async () => {
    if (!selectedUser || !user) {
      console.log('⚠️ No selected user or current user');
      return;
    }

    try {
      console.log('🔗 Starting vincular process:', {
        selectedUser: selectedUser.id,
        asociacion: user.uid
      });

      // Usar el método mejorado para verificar si el usuario puede ser agregado
      const userExists = await userSearchService.getUserByIdEnhanced(selectedUser.id);
      
      if (!userExists) {
        toast.error('Usuario no encontrado en el sistema');
        console.log('❌ User not found in enhanced search');
        return;
      }

      // Verificar si el usuario puede ser agregado como socio
      const canAdd = await userSearchService.canAddAsSocio(selectedUser.id, user.uid);
      console.log('✅ Can add check result:', canAdd);
      
      if (!canAdd.canAdd) {
        const errorMsg = canAdd.reason || 'No se puede agregar este usuario como socio';
        toast.error(errorMsg);
        console.log('❌ Cannot add user:', errorMsg);
        return;
      }

      const success = await vincularSocio(selectedUser.id);
      console.log('🔗 Vincular result:', success);
      
      if (success) {
        toast.success('Socio vinculado exitosamente');
        console.log('✅ Socio vinculado exitosamente');
        onSuccess?.();
        onClose();
      } else {
        toast.error('Error al vincular el socio');
        console.log('❌ Error al vincular el socio');
      }
    } catch (err) {
      console.error('❌ Error vinculando socio:', err);
      toast.error('Error al vincular el socio');
    }
  };

  // Manejar tecla Enter en la búsqueda
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.1 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Vincular Socio Existente
                      </h2>
                      <p className="text-white/80 text-sm">
                        Busca usuarios con role &quot;socio&quot; para vincular a la asociación
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Search Section */}
                <div className="space-y-6">
                  <div className="flex space-x-3">
                    <div className="relative flex-1">
                      <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Buscar por nombre, email o DNI..."
                        className="w-full py-3 pl-10 pr-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm"
                        disabled={searching || vinculandoSocio}
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      disabled={!searchTerm.trim() || searching || vinculandoSocio}
                      className="px-6 py-3 text-white transition-all duration-200 bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                      {searching ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'Buscar'
                      )}
                    </button>
                  </div>

                  {/* Results Section */}
                  <div>
                    {error && (
                      <div className="p-4 mb-4 text-sm text-red-700 bg-red-50 rounded-xl border-2 border-red-200">
                        <div className="flex items-center">
                          <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                          <span className="font-medium">{error}</span>
                        </div>
                        <div className="mt-2 text-xs text-red-600">
                          💡 Tip: Asegúrate de que existan usuarios registrados con role &quot;socio&quot; en Firebase
                        </div>
                      </div>
                    )}

                    {users.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <User className="w-4 h-4 mr-2 text-indigo-600" />
                          Usuarios encontrados ({users.length})
                        </h4>
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {users.map((user) => (
                            <div
                              key={user.id}
                              onClick={() => setSelectedUser(user)}
                              className={`p-4 transition-all duration-200 border-2 rounded-xl cursor-pointer hover:shadow-md ${
                                selectedUser?.id === user.id
                                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {user.avatar ? (
                                    <Image
                                      src={user.avatar}
                                      alt={user.nombre}
                                      width={40}
                                      height={40}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                      <User className="w-5 h-5 text-white" />
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{user.nombre}</h4>
                                    <div className="flex items-center mt-1 space-x-4 text-sm text-gray-500">
                                      <span className="flex items-center">
                                        <Mail className="w-4 h-4 mr-1" />
                                        {user.email}
                                      </span>
                                      {user.telefono && (
                                        <span className="flex items-center">
                                          <Phone className="w-4 h-4 mr-1" />
                                          {user.telefono}
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-400">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 mr-2">
                                        {user.role}
                                      </span>
                                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                        {user.estado}
                                      </span>
                                      {user.dni && (
                                        <span className="ml-2 text-gray-500">
                                          DNI: {user.dni}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {selectedUser?.id === user.id && (
                                  <CheckCircle className="w-6 h-6 text-indigo-600" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchTerm && !searching && users.length === 0 && !error && (
                      <div className="text-center py-12">
                        <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No se encontraron usuarios</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Busca usuarios con role &quot;socio&quot; registrados en el sistema
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    disabled={vinculandoSocio}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleVincular}
                    disabled={!selectedUser || vinculandoSocio}
                    className="flex items-center px-6 py-2 text-white transition-all duration-200 bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {vinculandoSocio ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Vinculando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5 mr-2" />
                        Vincular Socio
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};