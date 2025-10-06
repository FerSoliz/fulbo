
'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

// El tipo de vista no cambia, sigue siendo nuestra guía
export type ProfileView = 'buttons' | 'history' | 'stats' | 'next_match' | 'sudone_pass' | 'ranking_preview' | 'favorite_tournaments' | 'my_team';

interface ProfileActionsProps {
  setView: (view: ProfileView) => void;
}

// 1. Centralizamos la información de los botones en un array de objetos.
// Cada objeto tiene todo lo necesario para renderizar un botón.
const profileButtons = [
  {
    view: 'history' as ProfileView,
    label: 'Ver historial de partidos',
    alt: 'Historial',
    // Usamos rutas locales, asumiendo que las imágenes estarán en `public/assets/profile/`
    src: '/assets/profile/historial.png',
  },
  {
    view: 'next_match' as ProfileView,
    label: 'Ver próximo partido',
    alt: 'Próximo Partido',
    src: '/assets/profile/proximo-partido.png',
  },
  {
    view: 'stats' as ProfileView,
    label: 'Ver estadísticas',
    alt: 'Estadísticas',
    src: '/assets/profile/estadisticas.png',
  },
  {
    view: 'my_team' as ProfileView,
    label: 'Ver mi equipo',
    alt: 'Mi Equipo',
    src: '/assets/profile/mi-equipo.png',
  },
  {
    view: 'sudone_pass' as ProfileView,
    label: 'Ver SUDONE PASS',
    alt: 'SUDONE PASS',
    src: '/assets/profile/sudone-pass.png',
  },
  {
    view: 'ranking_preview' as ProfileView,
    label: 'Ver ranking de jugadores',
    alt: 'Ranking',
    src: '/assets/profile/ranking.png',
  },
  {
    view: 'favorite_tournaments' as ProfileView,
    label: 'Ver torneos favoritos',
    alt: 'Torneos Favoritos',
    src: '/assets/profile/torneos-favoritos.png',
  },
];

export const ProfileActions = ({ setView }: ProfileActionsProps) => {
  return (
    <Card>
      <CardContent className="p-4 grid grid-cols-4 gap-4">
        {/* 2. Mapeamos el array para generar los botones dinámicamente. */}
        {/* Ahora el código es mucho más corto, limpio y fácil de mantener. */}
        {profileButtons.map((button) => (
          <button
            key={button.view}
            className="transition-transform hover:scale-105"
            onClick={() => setView(button.view)}
            aria-label={button.label}
          >
            <Image src={button.src} alt={button.alt} width={150} height={50} />
          </button>
        ))}
      </CardContent>
    </Card>
  );
};
