'use client';

import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
}

export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 1920,
    screenHeight: 1080,
    userAgent: ''
  });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // Detectar móvil por user agent
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      const isMobileUA = mobileRegex.test(userAgent);

      // Detectar por tamaño de pantalla
      const isMobileScreen = screenWidth <= 768;
      const isTabletScreen = screenWidth > 768 && screenWidth <= 1024;

      // Combinar detección
      const isMobile = isMobileUA || isMobileScreen;
      const isTablet = !isMobile && isTabletScreen;
      const isDesktop = !isMobile && !isTablet;

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        screenWidth,
        screenHeight,
        userAgent
      });
    };

    // Detectar al cargar
    detectDevice();

    // Detectar al cambiar tamaño de ventana
    const handleResize = () => {
      detectDevice();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return deviceInfo;
};