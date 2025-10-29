import { doc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';

/**
 * Servicio para numeración consecutiva de socios por asociación.
 * Usa un contador transaccional por asociación para evitar colisiones en concurrencia.
 *
 * Estructura del documento de contador:
 * - Ruta: asociaciones/{asociacionId}/metadata/counters
 * - Campos:
 *   - nextSocioNumber: number (siguiente número a asignar)
 *   - updatedAt: serverTimestamp
 */
class SocioNumberService {
  private getCounterRef(asociacionId: string) {
    return doc(db, COLLECTIONS.ASOCIACIONES, asociacionId, 'metadata', 'counters');
  }

  /**
   * Obtiene el siguiente número consecutivo para la asociación indicada.
   * Garantiza atomicidad usando una transacción de Firestore.
   * Devuelve el número en formato de string con padding a 3 dígitos por compatibilidad (001, 002, ...).
   */
  async getNextSocioNumber(asociacionId: string): Promise<string> {
    if (!asociacionId) throw new Error('asociacionId es requerido');

    const counterRef = this.getCounterRef(asociacionId);

    const newNumber = await runTransaction(db, async (tx) => {
      const snap = await tx.get(counterRef);

      // Inicializar contador si no existe
      if (!snap.exists()) {
        tx.set(counterRef, { nextSocioNumber: 2, updatedAt: serverTimestamp() });
        // El primer número asignado será 1
        return 1;
      }

      const data = snap.data() as { nextSocioNumber?: number } | undefined;
      const current = Number(data?.nextSocioNumber ?? 1);
      const assigned = current; // número a asignar ahora
      const next = current + 1; // siguiente a persistir

      tx.update(counterRef, { nextSocioNumber: next, updatedAt: serverTimestamp() });
      return assigned;
    });

    // Padding a 3+ dígitos para mantener formato existente (e.g., '001')
    const padded = newNumber.toString().padStart(3, '0');
    return padded;
  }

  /**
   * Permite inicializar manualmente el contador de una asociación si se requiere una migración.
   */
  async initializeCounter(asociacionId: string, startAt: number = 1): Promise<void> {
    const counterRef = this.getCounterRef(asociacionId);
    await setDoc(counterRef, { nextSocioNumber: Math.max(1, startAt), updatedAt: serverTimestamp() }, { merge: true });
  }
}

export const socioNumberService = new SocioNumberService();
export default socioNumberService;
