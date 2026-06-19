import { doc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { supabase } from './supabaseClient';
import { toast } from '@/hooks/use-toast';
import { useStore } from './store';

// Memoria temporal local para acumular cambios (Evita llamadas excesivas de red)
let syncTimeout: NodeJS.Timeout | null = null;
let pendingPayloads: Record<string, any> = {};

/**
 * @summary Orquestador de Redundancia Inversa y Caché Local (Offline-First).
 * Acumula escrituras en local durante 5 segundos y luego realiza un guardado consolidado en red.
 */
export async function syncUserData(uid: string | null, payload: any) {
  if (!uid) {
    // MODO INVITADO: Se queda exclusivamente en Zustand (localStorage)
    return;
  }

  // Acumular la carga útil en memoria local
  pendingPayloads = {
    ...pendingPayloads,
    ...payload,
    updated_at: new Date().toISOString()
  };

  // Si ya hay un temporizador activo, lo limpiamos para reiniciar la espera (Debounce)
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  // Programar la sincronización diferida después de 5 segundos de inactividad
  syncTimeout = setTimeout(async () => {
    const dataToSync = { ...pendingPayloads };
    pendingPayloads = {}; // Limpiar buffer de pendientes

    const { firestore } = initializeFirebase();
    const userDocRef = doc(firestore, 'users', uid);

    try {
      // INTENTO PRIMARIO: Firebase Firestore (Batch Consolidation)
      await setDoc(userDocRef, dataToSync, { merge: true });
      console.log("[SoftIA Cache] Datos sincronizados con Firestore exitosamente.");
      
    } catch (error: any) {
      const errorCode = error.code || '';
      const isQuotaExceeded = errorCode === 'resource-exhausted' || error.message?.includes('429');

      if (isQuotaExceeded || !navigator.onLine) {
        // FALLBACK REDUNDANTE: Supabase
        try {
          const { error: supabaseError } = await supabase
            .from('user_profiles')
            .upsert({ 
              id: uid, 
              ...dataToSync, 
              synced_from: 'failover_sync'
            });

          if (supabaseError) throw supabaseError;

          toast({
            title: "⚠️ Redundancia de Red Activa",
            description: "Guardado local sincronizado con Supabase por saturación del servidor principal.",
          });
          
        } catch (fallbackError) {
          console.error("[SoftIA Cache] Fallo en sincronización redundante:", fallbackError);
        }
      } else {
        console.error("[SoftIA Cache] Error de red:", error);
      }
    }
  }, 5000);
}
