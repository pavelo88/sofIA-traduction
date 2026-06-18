"use client";

import { useEffect } from 'react';
import { useStore } from '@/lib/store';

/**
 * @summary Hook que simula el monitoreo térmico del hardware.
 * Justificación Técnica: El procesamiento de IA On-Device (OCR/LLM) es intensivo. 
 * Reducir la resolución y FPS previene el cierre inesperado por sobrecalentamiento.
 */
export function useThermalManager() {
  const { thermalTemperature, setThermalTemperature } = useStore();

  useEffect(() => {
    // Simulamos una fluctuación de temperatura basada en el uso intensivo
    const interval = setInterval(() => {
      const delta = Math.random() > 0.6 ? 1 : -0.5;
      const newTemp = Math.max(35, Math.min(50, thermalTemperature + delta));
      setThermalTemperature(newTemp);
    }, 5000);

    return () => clearInterval(interval);
  }, [thermalTemperature, setThermalTemperature]);

  return {
    temperature: thermalTemperature,
    isCritical: thermalTemperature > 45
  };
}
