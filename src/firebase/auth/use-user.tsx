
'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

/**
 * @summary Hook de usuario con Fallback de Seguridad Proactivo.
 * Implementa un timeout para forzar el Modo Invitado si Auth no responde.
 */
export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Timeout de seguridad: Si Auth no resuelve en 2s, asumimos modo invitado
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("[SoftIA Auth] Timeout alcanzado. Forzando sesión local.");
        setUser({
          uid: 'guest-session-stable',
          email: 'invitado@softia.local',
          displayName: 'Explorador Invitado'
        } as any);
        setLoading(false);
      }
    }, 2000);

    try {
      if (!auth) throw new Error("Auth service not initialized");

      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
        } else {
          // Si no hay usuario, proporcionamos el perfil de invitado estable
          setUser({
            uid: 'guest-session-stable',
            email: 'invitado@softia.local'
          } as any);
        }
        setLoading(false);
        clearTimeout(timeout);
      }, (error) => {
        console.warn("[SoftIA Auth] Fallback por error de dominio/config:", error.message);
        setUser({
          uid: 'guest-session-stable',
          email: 'invitado@softia.local'
        } as any);
        setLoading(false);
        clearTimeout(timeout);
      });

      return () => {
        unsubscribe();
        clearTimeout(timeout);
      };
    } catch (err) {
      setUser({ uid: 'guest-session-fallback', email: 'offline@softia.local' } as any);
      setLoading(false);
      return () => clearTimeout(timeout);
    }
  }, [auth]);

  return { user, loading };
}
