import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

// Inicializa next-pwa con su configuración
const withPwa = withPWA({
  dest: 'public', // Directorio donde se generan los archivos del service worker
  register: true, // Registra el service worker automáticamente
  skipWaiting: true, // Permite que el nuevo service worker se active inmediatamente
  disable: process.env.NODE_ENV === 'development', // Deshabilita la PWA en entorno de desarrollo para facilitar la depuración
});

// Tu configuración actual de Next.js
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static-cdn.jtvnw.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatar.vercel.sh',
        port: '',
        pathname: '/**',
      } 
    ],
  },
};

// Exporta la configuración de Next.js envuelta por la configuración de PWA
export default withPwa(nextConfig);
