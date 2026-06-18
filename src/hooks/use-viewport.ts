
'use client';

import { useState, useEffect } from 'react';

/**
 * @summary Hook para detección reactiva de viewports.
 * Segmentación: Mobile (<640px), Tablet (640px-1024px), Desktop (>1024px).
 */
export function useViewport() {
  const [viewport, setViewport] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    mounted: false
  });

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 639px)');
    const tabletQuery = window.matchMedia('(min-width: 640px) and (max-width: 1023px)');
    const desktopQuery = window.matchMedia('(min-width: 1024px)');

    const updateViewport = () => {
      setViewport({
        isMobile: mobileQuery.matches,
        isTablet: tabletQuery.matches,
        isDesktop: desktopQuery.matches,
        mounted: true
      });
    };

    updateViewport();
    mobileQuery.addEventListener('change', updateViewport);
    tabletQuery.addEventListener('change', updateViewport);
    desktopQuery.addEventListener('change', updateViewport);

    return () => {
      mobileQuery.removeEventListener('change', updateViewport);
      tabletQuery.removeEventListener('change', updateViewport);
      desktopQuery.removeEventListener('change', updateViewport);
    };
  }, []);

  return viewport;
}
