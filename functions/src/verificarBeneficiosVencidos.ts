import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

export const verificarBeneficiosVencidos = functions.pubsub
  .schedule('0 2 * * *') // Ejecutar todos los días a las 2 AM
  .timeZone('America/Mexico_City')
  .onRun(async () => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    
    try {
      console.log('🔍 Verificando beneficios vencidos...');
      
      // Buscar beneficios activos que ya vencieron
      const beneficiosVencidos = await db
        .collection('beneficios')
        .where('estado', '==', 'activo')
        .where('fechaFin', '<=', now)
        .get();
      
      if (beneficiosVencidos.empty) {
        console.log('✅ No hay beneficios vencidos');
        return null;
      }
      
      // Actualizar en lotes
      const batch = db.batch();
      let count = 0;
      
      beneficiosVencidos.docs.forEach(doc => {
        batch.update(doc.ref, {
          estado: 'vencido',
          actualizadoEn: now
        });
        count++;
      });
      
      await batch.commit();
      
      console.log(`✅ Se marcaron ${count} beneficios como vencidos`);
      
      // Opcional: Enviar notificación a comercios
      // await notificarComerciosBeneficiosVencidos(beneficiosVencidos.docs);
      
      return null;
    } catch (error) {
      console.error('❌ Error verificando beneficios vencidos:', error);
      throw error;
    }
  });
