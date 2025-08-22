import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { handleFirebaseError } from '@/lib/firebase-errors';
import {
  Cliente,
  ClienteFormData,
  ClienteStats,
  ClienteActivity,
  ClienteFilter,
  ClienteSegment,
  ClienteExport,
  ClienteAutoData,
} from '@/types/cliente';

export class ClienteService {
  private static readonly COLLECTION = 'clientes'; // Colección específica para clientes
  private static readonly ACTIVITIES_COLLECTION = 'cliente_activities';
  private static readonly SEGMENTS_COLLECTION = 'cliente_segments';

  /**
   * Crea o actualiza un cliente automáticamente desde validación QR
   */
  static async createOrUpdateClienteFromValidation(
    clienteData: ClienteAutoData,
    validacionId: string
  ): Promise<string> {
    try {
      // Buscar si ya existe un cliente para este socio en este comercio
      const clientesRef = collection(db, this.COLLECTION);
      const existingClienteQuery = query(
        clientesRef,
        where('socioId', '==', clienteData.socioId),
        where('comercioId', '==', clienteData.comercioId)
      );
      
      const existingClienteSnapshot = await getDocs(existingClienteQuery);
      const now = Timestamp.now();

      if (!existingClienteSnapshot.empty) {
        // Cliente existe, actualizar estadísticas de visita
        const clienteDoc = existingClienteSnapshot.docs[0];
        const clienteId = clienteDoc.id;
        const cliente = clienteDoc.data() as Cliente;

        await updateDoc(doc(db, this.COLLECTION, clienteId), {
          totalValidaciones: cliente.totalValidaciones + 1,
          fechaUltimaVisita: now,
          ultimoAcceso: now,
          actualizadoEn: now,
        });

        // Registrar actividad de validación QR
        await this.logActivity(clienteId, {
          tipo: 'validacion_qr',
          descripcion: 'Validación QR realizada en el comercio',
          validacionId,
          fecha: now,
        });

        return clienteId;
      } else {
        // Cliente no existe, crear nuevo
        const nuevoCliente: Omit<Cliente, 'id'> = {
          nombre: clienteData.socioNombre,
          email: clienteData.socioEmail || `${clienteData.socioId}@temp.com`,
          socioId: clienteData.socioId,
          comercioId: clienteData.comercioId,
          asociacionId: clienteData.asociacionId,
          estado: 'activo',
          creadoEn: now,
          actualizadoEn: now,
          ultimoAcceso: now,
          
          // Información sobre creación automática
          creadoAutomaticamente: true,
          datosCompletos: false,
          fechaPrimeraVisita: now,
          fechaUltimaVisita: now,
          
          // Estadísticas iniciales
          totalCompras: 0,
          montoTotalGastado: 0,
          beneficiosUsados: 0,
          ahorroTotal: 0,
          frecuenciaVisitas: 1,
          totalValidaciones: 1,
          promedioCompra: 0,
          categoriasFavoritas: [],
          
          // Configuración por defecto
          configuracion: {
            recibirNotificaciones: true,
            recibirPromociones: true,
            recibirEmail: true,
            recibirSMS: false,
          },
        };

        const clienteRef = await addDoc(collection(db, this.COLLECTION), nuevoCliente);

        // Registrar actividades
        await this.logActivity(clienteRef.id, {
          tipo: 'registro',
          descripcion: 'Cliente creado automáticamente por validación QR',
          fecha: now,
        });

        await this.logActivity(clienteRef.id, {
          tipo: 'validacion_qr',
          descripcion: 'Primera validación QR realizada',
          validacionId,
          fecha: now,
        });

        return clienteRef.id;
      }
    } catch (error) {
      console.error('Error creating/updating cliente from validation:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Completa los datos de un cliente creado automáticamente
   */
  static async completarDatosCliente(
    clienteId: string,
    datosCompletos: Partial<ClienteFormData>
  ): Promise<void> {
    try {
      const clienteRef = doc(db, this.COLLECTION, clienteId);
      const clienteSnap = await getDoc(clienteRef);

      if (!clienteSnap.exists()) {
        throw new Error('Cliente no encontrado');
      }

      const cliente = clienteSnap.data() as Cliente;

      // Validar que el cliente fue creado automáticamente
      if (!cliente.creadoAutomaticamente) {
        throw new Error('Este cliente no fue creado automáticamente');
      }

      const { fechaNacimiento, ...restDatos } = datosCompletos;
      
      const updateData: Partial<Cliente> = {
        ...restDatos,
        datosCompletos: true,
        actualizadoEn: Timestamp.now(),
      };

      // Solo agregar fechaNacimiento si existe y no está vacía
      if (fechaNacimiento && fechaNacimiento.trim() !== '') {
        updateData.fechaNacimiento = Timestamp.fromDate(new Date(fechaNacimiento));
      }

      // Si se proporciona email válido, actualizar
      if (datosCompletos.email && !datosCompletos.email.includes('@temp.com')) {
        updateData.email = datosCompletos.email;
      }

      await updateDoc(clienteRef, updateData);

      // Registrar actividad
      await this.logActivity(clienteId, {
        tipo: 'actualizacion',
        descripcion: 'Datos del cliente completados por el comercio',
        fecha: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error completing cliente data:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Obtiene todos los clientes de un comercio
   */
  static async getClientesByComercio(
    comercioId: string,
    filtros: ClienteFilter = {}
  ): Promise<{ clientes: Cliente[]; total: number; hasMore: boolean }> {
    try {
      console.log('🔍 Buscando clientes para comercio:', comercioId);
      console.log('🔍 Filtros aplicados:', filtros);
      
      const clientesRef = collection(db, this.COLLECTION);
      let q = query(clientesRef, where('comercioId', '==', comercioId));

      // Aplicar filtros
      if (filtros.estado) {
        q = query(q, where('estado', '==', filtros.estado));
      }

      if (filtros.datosCompletos !== undefined) {
        q = query(q, where('datosCompletos', '==', filtros.datosCompletos));
      }

      if (filtros.creadoAutomaticamente !== undefined) {
        q = query(q, where('creadoAutomaticamente', '==', filtros.creadoAutomaticamente));
      }

      if (filtros.fechaDesde) {
        q = query(q, where('creadoEn', '>=', Timestamp.fromDate(filtros.fechaDesde)));
      }

      if (filtros.fechaHasta) {
        q = query(q, where('creadoEn', '<=', Timestamp.fromDate(filtros.fechaHasta)));
      }

      // Ordenamiento
      const ordenarPor = filtros.ordenarPor === 'fechaCreacion' ? 'creadoEn' : (filtros.ordenarPor || 'creadoEn');
      const orden = filtros.orden || 'desc';
      q = query(q, orderBy(ordenarPor, orden));

      // Paginación
      const limite = filtros.limite || 20;
      q = query(q, limit(limite));

      console.log('🔍 Ejecutando query con ordenamiento:', ordenarPor, orden);

      const snapshot = await getDocs(q);
      console.log('🔍 Documentos encontrados:', snapshot.size);
      
      const clientes = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('🔍 Cliente encontrado:', doc.id, data.nombre);
        return {
          id: doc.id,
          ...data,
        };
      }) as Cliente[];

      // Filtros adicionales en memoria
      let clientesFiltrados = clientes;

      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        clientesFiltrados = clientesFiltrados.filter(cliente =>
          cliente.nombre.toLowerCase().includes(busqueda) ||
          cliente.email.toLowerCase().includes(busqueda) ||
          cliente.telefono?.includes(busqueda) ||
          cliente.dni?.includes(busqueda)
        );
      }

      if (filtros.montoMinimo) {
        clientesFiltrados = clientesFiltrados.filter(
          cliente => cliente.montoTotalGastado >= filtros.montoMinimo!
        );
      }

      if (filtros.montoMaximo) {
        clientesFiltrados = clientesFiltrados.filter(
          cliente => cliente.montoTotalGastado <= filtros.montoMaximo!
        );
      }

      if (filtros.tags && filtros.tags.length > 0) {
        clientesFiltrados = clientesFiltrados.filter(cliente =>
          filtros.tags!.some(tag => cliente.tags?.includes(tag))
        );
      }

      console.log('✅ Clientes filtrados:', clientesFiltrados.length);

      return {
        clientes: clientesFiltrados,
        total: clientesFiltrados.length,
        hasMore: snapshot.docs.length === limite,
      };
    } catch (error) {
      console.error('❌ Error fetching clientes:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Obtiene un cliente por ID
   */
  static async getClienteById(clienteId: string): Promise<Cliente | null> {
    try {
      const clienteRef = doc(db, this.COLLECTION, clienteId);
      const clienteSnap = await getDoc(clienteRef);

      if (clienteSnap.exists()) {
        return {
          id: clienteSnap.id,
          ...clienteSnap.data(),
        } as Cliente;
      }

      return null;
    } catch (error) {
      console.error('Error fetching cliente:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Crea un nuevo cliente manualmente
   */
  static async createCliente(
    comercioId: string,
    clienteData: ClienteFormData
  ): Promise<string> {
    try {
      console.log('🚀 Creando cliente con datos:', clienteData);
      
      const now = Timestamp.now();
      
      // Preparar datos del cliente, manejando campos opcionales correctamente
      const nuevoCliente: Record<string, unknown> = {
        nombre: clienteData.nombre,
        email: clienteData.email,
        estado: 'activo',
        comercioId,
        creadoEn: now,
        actualizadoEn: now,
        
        // Información sobre creación manual
        creadoAutomaticamente: false,
        datosCompletos: true,
        
        // Estadísticas iniciales
        totalCompras: 0,
        montoTotalGastado: 0,
        beneficiosUsados: 0,
        ahorroTotal: 0,
        frecuenciaVisitas: 0,
        totalValidaciones: 0,
        categoriasFavoritas: [],
        promedioCompra: 0,
        
        // Configuración
        configuracion: clienteData.configuracion,
      };

      // Solo agregar campos opcionales si tienen valor
      if (clienteData.telefono && clienteData.telefono.trim() !== '') {
        nuevoCliente.telefono = clienteData.telefono.trim();
      }

      if (clienteData.dni && clienteData.dni.trim() !== '') {
        nuevoCliente.dni = clienteData.dni.trim();
      }

      if (clienteData.direccion && clienteData.direccion.trim() !== '') {
        nuevoCliente.direccion = clienteData.direccion.trim();
      }

      if (clienteData.notas && clienteData.notas.trim() !== '') {
        nuevoCliente.notas = clienteData.notas.trim();
      }

      if (clienteData.tags && clienteData.tags.length > 0) {
        nuevoCliente.tags = clienteData.tags;
      } else {
        nuevoCliente.tags = [];
      }

      // Solo agregar fechaNacimiento si existe y es válida
      if (clienteData.fechaNacimiento && clienteData.fechaNacimiento.trim() !== '') {
        try {
          const fecha = new Date(clienteData.fechaNacimiento);
          if (!isNaN(fecha.getTime())) {
            nuevoCliente.fechaNacimiento = Timestamp.fromDate(fecha);
          }
        } catch (dateError) {
          console.warn('⚠️ Error parsing fecha nacimiento, omitiendo campo:', dateError);
        }
      }

      console.log('📝 Datos finales para crear cliente (sin undefined):', nuevoCliente);

      const clienteRef = await addDoc(collection(db, this.COLLECTION), nuevoCliente);
      console.log('✅ Cliente creado con ID:', clienteRef.id);

      // Registrar actividad
      await this.logActivity(clienteRef.id, {
        tipo: 'registro',
        descripcion: 'Cliente registrado manualmente por el comercio',
        fecha: now,
      });

      return clienteRef.id;
    } catch (error) {
      console.error('❌ Error creating cliente:', error);
      console.error('❌ Error details:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Actualiza un cliente
   */
  static async updateCliente(
    clienteId: string,
    clienteData: Partial<ClienteFormData>
  ): Promise<void> {
    try {
      const clienteRef = doc(db, this.COLLECTION, clienteId);
      
      const { fechaNacimiento, ...restClienteData } = clienteData;
      
      // Preparar datos de actualización
      const updateData: Record<string, unknown> = {
        actualizadoEn: Timestamp.now(),
      };

      // Solo agregar campos que tienen valor
      Object.keys(restClienteData).forEach(key => {
        const value = restClienteData[key as keyof typeof restClienteData];
        if (value !== undefined && value !== null && value !== '') {
          updateData[key] = value;
        }
      });

      // Solo agregar fechaNacimiento si existe y no está vacía
      if (fechaNacimiento && fechaNacimiento.trim() !== '') {
        try {
          const fecha = new Date(fechaNacimiento);
          if (!isNaN(fecha.getTime())) {
            updateData.fechaNacimiento = Timestamp.fromDate(fecha);
          }
        } catch (dateError) {
          console.warn('⚠️ Error parsing fecha nacimiento en actualización, omitiendo campo:', dateError);
        }
      }

      // Si el cliente fue creado automáticamente y se están actualizando datos importantes,
      // marcar como datos completos
      const clienteSnap = await getDoc(clienteRef);
      if (clienteSnap.exists()) {
        const cliente = clienteSnap.data() as Cliente;
        if (cliente.creadoAutomaticamente && !cliente.datosCompletos) {
          // Verificar si se están proporcionando datos suficientes
          const datosImportantes = ['telefono', 'direccion', 'fechaNacimiento'].some(
            campo => clienteData[campo as keyof ClienteFormData]
          );
          
          if (datosImportantes) {
            updateData.datosCompletos = true;
          }
        }
      }

      await updateDoc(clienteRef, updateData);

      // Registrar actividad
      await this.logActivity(clienteId, {
        tipo: 'actualizacion',
        descripcion: 'Perfil del cliente actualizado',
        fecha: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating cliente:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Elimina un cliente
   */
  static async deleteCliente(clienteId: string): Promise<void> {
    try {
      const clienteRef = doc(db, this.COLLECTION, clienteId);
      await deleteDoc(clienteRef);
    } catch (error) {
      console.error('Error deleting cliente:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Actualiza el estado de un cliente
   */
  static async updateEstadoCliente(
    clienteId: string,
    estado: 'activo' | 'inactivo' | 'suspendido'
  ): Promise<void> {
    try {
      const clienteRef = doc(db, this.COLLECTION, clienteId);
      await updateDoc(clienteRef, {
        estado,
        actualizadoEn: Timestamp.now(),
      });

      // Registrar actividad
      await this.logActivity(clienteId, {
        tipo: 'actualizacion',
        descripcion: `Estado del cliente cambiado a: ${estado}`,
        fecha: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating cliente estado:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Sube imagen de perfil del cliente
   */
  static async uploadClienteImage(clienteId: string, file: File): Promise<string> {
    try {
      // Validar archivo
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no puede superar los 5MB');
      }

      // Generar path único
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'jpg';
      const imagePath = `clientes/${clienteId}/avatar_${timestamp}.${extension}`;

      // Subir imagen
      const imageRef = ref(storage, imagePath);
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);

      // Actualizar cliente con nueva URL
      const clienteRef = doc(db, this.COLLECTION, clienteId);
      await updateDoc(clienteRef, {
        avatar: downloadURL,
        actualizadoEn: Timestamp.now(),
      });

      return downloadURL;
    } catch (error) {
      console.error('Error uploading cliente image:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Obtiene estadísticas de clientes para un comercio
   */
  static async getClienteStats(comercioId: string): Promise<ClienteStats> {
    try {
      console.log('📊 Calculando estadísticas para comercio:', comercioId);
      
      const clientesRef = collection(db, this.COLLECTION);
      const q = query(clientesRef, where('comercioId', '==', comercioId));
      const snapshot = await getDocs(q);

      console.log('📊 Documentos encontrados para stats:', snapshot.size);

      const clientes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Cliente[];

      const totalClientes = clientes.length;
      const clientesActivos = clientes.filter(c => c.estado === 'activo').length;
      const clientesInactivos = clientes.filter(c => c.estado === 'inactivo').length;
      const clientesPendientesCompletar = clientes.filter(c => 
        c.creadoAutomaticamente && !c.datosCompletos
      ).length;
      const clientesCompletados = clientes.filter(c => c.datosCompletos).length;

      // Clientes nuevos (últimos 30 días)
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);
      const clientesNuevos = clientes.filter(c => 
        c.creadoEn.toDate() >= hace30Dias
      ).length;

      // Estadísticas de compras y validaciones
      const totalCompras = clientes.reduce((sum, c) => sum + c.totalCompras, 0);
      const montoTotal = clientes.reduce((sum, c) => sum + c.montoTotalGastado, 0);
      const validacionesTotales = clientes.reduce((sum, c) => sum + (c.totalValidaciones || 0), 0);
      const promedioComprasPorCliente = totalClientes > 0 ? totalCompras / totalClientes : 0;
      const montoPromedioCompra = totalCompras > 0 ? montoTotal / totalCompras : 0;

      // Clientes más activos (por validaciones QR)
      const clientesMasActivos = clientes
        .sort((a, b) => (b.totalValidaciones || 0) - (a.totalValidaciones || 0))
        .slice(0, 5);

      // Crecimiento mensual
      const crecimientoMensual = clientesNuevos > 0 ? 
        ((clientesNuevos / Math.max(totalClientes - clientesNuevos, 1)) * 100) : 0;

      // Retención de clientes
      const retencionClientes = totalClientes > 0 ? 
        (clientesActivos / totalClientes) * 100 : 0;

      // Valor de vida promedio
      const valorVidaPromedio = totalClientes > 0 ? montoTotal / totalClientes : 0;

      const stats = {
        totalClientes,
        clientesActivos,
        clientesNuevos,
        clientesInactivos,
        clientesPendientesCompletar,
        clientesCompletados,
        promedioComprasPorCliente,
        montoPromedioCompra,
        clientesMasActivos,
        crecimientoMensual,
        retencionClientes,
        valorVidaPromedio,
        validacionesTotales,
      };

      console.log('📊 Stats calculadas:', stats);
      return stats;
    } catch (error) {
      console.error('Error getting cliente stats:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Obtiene actividades de un cliente
   */
  static async getClienteActivities(
    clienteId: string,
    limite: number = 20
  ): Promise<ClienteActivity[]> {
    try {
      const activitiesRef = collection(db, this.ACTIVITIES_COLLECTION);
      const q = query(
        activitiesRef,
        where('clienteId', '==', clienteId),
        orderBy('fecha', 'desc'),
        limit(limite)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ClienteActivity[];
    } catch (error) {
      console.error('Error getting cliente activities:', error);
      return [];
    }
  }

  /**
   * Registra una actividad del cliente
   */
  static async logActivity(
    clienteId: string,
    activity: Omit<ClienteActivity, 'id' | 'clienteId'>
  ): Promise<void> {
    try {
      const activitiesRef = collection(db, this.ACTIVITIES_COLLECTION);
      await addDoc(activitiesRef, {
        clienteId,
        ...activity,
      });
    } catch (error) {
      console.error('Error logging cliente activity:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Actualiza estadísticas de compra de un cliente
   */
  static async updateClienteCompra(
    clienteId: string,
    montoCompra: number,
    beneficioUsado?: boolean
  ): Promise<void> {
    try {
      const clienteRef = doc(db, this.COLLECTION, clienteId);
      const clienteSnap = await getDoc(clienteRef);

      if (!clienteSnap.exists()) {
        throw new Error('Cliente no encontrado');
      }

      const cliente = clienteSnap.data() as Cliente;
      const nuevasTotalCompras = cliente.totalCompras + 1;
      const nuevoMontoTotal = cliente.montoTotalGastado + montoCompra;
      const nuevoPromedio = nuevoMontoTotal / nuevasTotalCompras;

      const updateData: Partial<Cliente> = {
        totalCompras: nuevasTotalCompras,
        montoTotalGastado: nuevoMontoTotal,
        promedioCompra: nuevoPromedio,
        fechaUltimaCompra: Timestamp.now(),
        ultimoAcceso: Timestamp.now(),
        actualizadoEn: Timestamp.now(),
      };

      if (beneficioUsado) {
        updateData.beneficiosUsados = cliente.beneficiosUsados + 1;
      }

      await updateDoc(clienteRef, updateData);

      // Registrar actividad
      await this.logActivity(clienteId, {
        tipo: 'compra',
        descripcion: `Compra realizada por $${montoCompra.toLocaleString()}`,
        monto: montoCompra,
        fecha: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating cliente compra:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Exporta datos de clientes
   */
  static async exportClientesData(comercioId: string): Promise<ClienteExport> {
    try {
      const { clientes } = await this.getClientesByComercio(comercioId, { limite: 1000 });
      const estadisticas = await this.getClienteStats(comercioId);
      
      // Obtener actividades de todos los clientes (limitado)
      const actividades: ClienteActivity[] = [];
      for (const cliente of clientes.slice(0, 10)) {
        const clienteActivities = await this.getClienteActivities(cliente.id, 5);
        actividades.push(...clienteActivities);
      }

      return {
        clientes,
        estadisticas,
        actividades,
        fechaExportacion: Timestamp.now(),
        comercioId,
        totalRegistros: clientes.length,
      };
    } catch (error) {
      console.error('Error exporting clientes data:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Busca clientes por texto
   */
  static async searchClientes(
    comercioId: string,
    searchTerm: string,
    limite: number = 10
  ): Promise<Cliente[]> {
    try {
      const { clientes } = await this.getClientesByComercio(comercioId, {
        busqueda: searchTerm,
        limite,
      });
      return clientes;
    } catch (error) {
      console.error('Error searching clientes:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Obtiene clientes por segmento
   */
  static async getClientesBySegment(segmentId: string): Promise<Cliente[]> {
    try {
      const segmentRef = doc(db, this.SEGMENTS_COLLECTION, segmentId);
      const segmentSnap = await getDoc(segmentRef);

      if (!segmentSnap.exists()) {
        throw new Error('Segmento no encontrado');
      }

      const segment = segmentSnap.data() as ClienteSegment;
      const { clientes } = await this.getClientesByComercio('', segment.criterios);
      return clientes;
    } catch (error) {
      console.error('Error getting clientes by segment:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Actualiza último acceso del cliente
   */
  static async updateUltimoAcceso(clienteId: string): Promise<void> {
    try {
      const clienteRef = doc(db, this.COLLECTION, clienteId);
      await updateDoc(clienteRef, {
        ultimoAcceso: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating ultimo acceso:', error);
      // No lanzar error para no interrumpir el flujo
    }
  }

  /**
   * Obtiene clientes pendientes de completar datos
   */
  static async getClientesPendientesCompletar(comercioId: string): Promise<Cliente[]> {
    try {
      const { clientes } = await this.getClientesByComercio(comercioId, {
        creadoAutomaticamente: true,
        datosCompletos: false,
        limite: 50,
      });
      return clientes;
    } catch (error) {
      console.error('Error getting clientes pendientes:', error);
      throw new Error(handleFirebaseError(error));
    }
  }
}

export const clienteService = new ClienteService();