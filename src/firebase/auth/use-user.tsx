
'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

/**
 * @summary Hook de usuario con Fallback de Seguridad.
 * Si Firebase Auth falla por configuración (Error 400), activa el Modo Invitado.
 */
export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      if (!auth) throw new Error("Auth service not initialized");

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      }, (error) => {
        console.warn("[SoftIA Auth] Fallback a Modo Invitado por error de red/config:", error.message);
        // Usuario simulado para no romper la hidratación
        setUser({
          uid: 'guest-session-stable',
          email: 'invitado@softia.local',
          displayName: 'Explorador Invitado'
        } as any);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("[SoftIA Auth] Error crítico en inicialización. Activando sesión local.");
      setUser({
        uid: 'guest-session-fallback',
        email: 'offline@softia.local'
      } as any);
      setLoading(false);
    }
  }, [auth]);

  return { user, loading };
}
