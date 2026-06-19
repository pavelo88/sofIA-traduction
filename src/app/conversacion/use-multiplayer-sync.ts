import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

/**
 * @summary Estructura futura para sincronización multi-dispositivo usando Firebase Firestore.
 * En el futuro, permitirá que dos dispositivos se conecten a la misma "Sala" (Room)
 * compartiendo el conversationHistory en tiempo real.
 */
export function useMultiplayerSync(roomId?: string) {
  useEffect(() => {
    if (!roomId) return;

    // Aquí irá la lógica de Firebase onSnapshot para escuchar cambios en la sala
    // y actualizar el store global (useStore) con los nuevos mensajes.
    console.log(`[SoftIA Multiplayer] Preparado para escuchar la sala: ${roomId}`);

    return () => {
      // Limpiar el listener de Firebase al desmontar
      console.log(`[SoftIA Multiplayer] Desconectado de la sala: ${roomId}`);
    };
  }, [roomId]);

  const connectToRoom = (id: string) => {
    toast({
      title: "Función Próximamente",
      description: `La conexión multi-dispositivo a la sala ${id} estará disponible en la próxima versión.`,
    });
  };

  const createRoom = () => {
    toast({
      title: "Función Próximamente",
      description: "La creación de salas multi-dispositivo estará disponible en la próxima versión.",
    });
  };

  return {
    connectToRoom,
    createRoom,
  };
}
