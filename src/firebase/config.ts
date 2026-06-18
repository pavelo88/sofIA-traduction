
'use client';

/**
 * @fileOverview Configuración de Firebase con validación estricta de entorno.
 * Asegura que las variables NEXT_PUBLIC se carguen correctamente en el cliente.
 */

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validación defensiva en desarrollo
if (typeof window !== 'undefined' && !firebaseConfig.apiKey) {
  console.warn('SoftIA: Firebase API Key no detectada en el cliente. Revisa el archivo .env');
}
