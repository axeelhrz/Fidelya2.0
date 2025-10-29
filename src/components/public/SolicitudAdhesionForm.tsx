'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Store,
  Mail,
  Phone,
  MapPin,
  FileText,
  Upload,
  Check,
  Send
} from 'lucide-react';
import { adhesionService, SolicitudAdhesion } from '@/services/adhesion.service';
import { toast } from 'react-hot-toast';

interface SolicitudAdhesionFormProps {
  asociacionId: string;
  onSuccess?: () => void;
}

export const SolicitudAdhesionForm: React.FC<SolicitudAdhesionFormProps> = ({
  asociacionId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    nombreComercio: '',
    nombre: '',
    email: '',
    telefono: '',
    categoria: '',
    direccion: '',
    mensaje: '',
    cuit: '',
    sitioWeb: '',
    horario: '',
    descripcion: ''
  });
  const [documentos, setDocumentos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categorias = [
    'Alimentación',
    'Salud',
    'Automotor',
    'Tecnología',
    'Educación',
    'Entretenimiento',
    'Servicios',
    'Retail',
    'Turismo',
    'Otros'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileNames = Array.from(files).map(file => file.name);
      setDocumentos(prev => [...prev, ...fileNames]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombreComercio || !formData.nombre || !formData.email || !formData.categoria) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);

    try {
      const solicitudData: Omit<SolicitudAdhesion, 'id' | 'creadoEn' | 'actualizadoEn'> = {
        asociacionId,
        nombreComercio: formData.nombreComercio,
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        categoria: formData.categoria,
        direccion: formData.direccion,
        mensaje: formData.mensaje,
        documentos,
        estado: 'pendiente',
        fechaSolicitud: (await import('firebase/firestore')).Timestamp.fromDate(new Date()), // Convert Date to Firestore Timestamp
        comercioData: {
          cuit: formData.cuit,
          sitioWeb: formData.sitioWeb,
          horario: formData.horario,
          descripcion: formData.descripcion
        }
      };

      const solicitudId = await adhesionService.crearSolicitudAdhesion(solicitudData);

      if (solicitudId) {
        setSubmitted(true);
        toast.success('Solicitud enviada exitosamente');
        onSuccess?.();
      } else {
        toast.error('Error al enviar la solicitud');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-200"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          ¡Solicitud Enviada!
        </h3>
        <p className="text-gray-600 mb-4">
          Tu solicitud de adhesión ha sido enviada exitosamente. 
          Te contactaremos pronto para revisar tu aplicación.
        </p>
        <p className="text-sm text-gray-500">
          Tiempo estimado de respuesta: 2-3 días hábiles
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-8"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Solicitud de Adhesión
        </h2>
        <p className="text-gray-600">
          Únete a nuestra red de comercios afiliados
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Comercio */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Store className="w-5 h-5 mr-2" />
            Información del Comercio
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Comercio *
              </label>
              <input
                type="text"
                name="nombreComercio"
                value={formData.nombreComercio}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Panadería San Juan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Dirección completa del comercio"
              />
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Información de Contacto
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Responsable *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tu nombre completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tu@email.com"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+54 11 1234-5678"
              />
            </div>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Información Adicional
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CUIT
              </label>
              <input
                type="text"
                name="cuit"
                value={formData.cuit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="20-12345678-9"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sitio Web
              </label>
              <input
                type="url"
                name="sitioWeb"
                value={formData.sitioWeb}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://tucomercio.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horario de Atención
            </label>
            <input
              type="text"
              name="horario"
              value={formData.horario}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Lun-Vie 9:00-18:00, Sáb 9:00-13:00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción del Comercio
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe brevemente tu comercio y los servicios que ofreces"
            />
          </div>
        </div>

        {/* Mensaje */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mensaje para la Asociación *
          </label>
          <textarea
            name="mensaje"
            value={formData.mensaje}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Explica por qué quieres unirte a la asociación y qué beneficios puedes ofrecer a los socios..."
          />
        </div>

        {/* Documentos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Documentos (opcional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Sube documentos como CUIT, habilitación comercial, etc.
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              Seleccionar Archivos
            </label>
          </div>
          {documentos.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-1">Archivos seleccionados:</p>
              <ul className="text-sm text-gray-500">
                {documentos.map((doc, index) => (
                  <li key={index} className="flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Enviar Solicitud
              </>
            )}
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Al enviar esta solicitud, aceptas que la asociación revise tu información 
            y se ponga en contacto contigo para el proceso de adhesión.
          </p>
        </div>
      </form>
    </motion.div>
  );
};

export default SolicitudAdhesionForm;
