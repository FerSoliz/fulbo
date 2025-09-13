// DIRECTIVA DE ENTORNO:
// Bloquear permanentemente todas las rutas de trabajo que empiecen con "C:/Users/sudon/OneDrive/Desktop/SUDONESITE2/public/".
// Usar EXCLUSIVAMENTE la ruta relativa "src/" como base para los assets.
// Esta regla se establece para resolver conflictos con Firebase Studio y el ordenador local.
// NO EDITAR NI PROGRAMAR USANDO RUTAS QUE NO CUMPLAN ESTA DIRECTIVA.

import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
      }
    ],
  },
};

export default nextConfig;
