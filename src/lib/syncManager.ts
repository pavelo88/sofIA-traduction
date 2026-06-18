
import { doc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { supabase } from './supabaseClient';
import { toast } from '@/hooks/use-toast';
import { useStore } from './store';

/**
 * @summary Orquestador de Redundancia Inversa.
 * Gestiona la sincronización entre Firebase (primario) y Supabase (respaldo).
 */
export async function syncUserData(uid: string | null, payload: any) {
  const store = useStore.getState();

  // MODO INVITADO: Persistencia local exclusiva
  if (!uid) {
    // Los datos ya se guardan en Zustand (persist middleware)
    return;
  }

  const { firestore } = initializeFirebase();
  const userDocRef = doc(firestore, 'users', uid);

  try {
    // INTENTO PRIMARIO: Firebase Firestore
    await setDoc(userDocRef, {
      ...payload,
      updated_at: new Date().toISOString()
    }, { merge: true });
    
  } catch (error: any) {
    const errorCode = error.code || '';
    const isQuotaExceeded = errorCode === 'resource-exhausted' || error.message?.includes('429');

    if (isQuotaExceeded || !navigator.onLine) {
      // BYPASS AUTOMÁTICO: Redundancia hacia Supabase
      try {
        const { error: supabaseError } = await supabase
          .from('user_profiles')
          .upsert({ 
            id: uid, 
            ...payload, 
            synced_from: 'failover_sync',
            updated_at: new Date().toISOString() 
          });

        if (supabaseError) throw supabaseError;

        toast({
          title: "⚠️ [TELEMETRÍA] Redundancia Activa",
          description: "Servidor principal saturado. Enrutando datos a la nube de respaldo Supabase de forma segura.",
          variant: "destructive"
        });
        
      } catch (fallbackError) {
        console.error("Falla catastrófica de sincronización:", fallbackError);
        toast({
          title: "Falla de Sincronización",
          description: "No se pudo establecer conexión con ninguna nube de respaldo.",
          variant: "destructive"
        });
      }
    } else {
      // Otros errores de Firestore
      console.error("Error de Firestore (Sincronización):", error);
    }
  }
}
