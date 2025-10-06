
'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

export type ProfileView = 'buttons' | 'history' | 'stats' | 'next_match' | 'sudone_pass' | 'ranking_preview' | 'favorite_tournaments' | 'my_team';

interface ProfileActionsProps {
  setView: (view: ProfileView) => void;
}

const profileButtons = [
  {
    view: 'history' as ProfileView,
    label: 'Ver historial de partidos',
    alt: 'Historial',
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
  /* --- INICIO: OCULTAR BOTÓN SUDONE PASS ---
  {
    view: 'sudone_pass' as ProfileView,
    label: 'Ver SUDONE PASS',
    alt: 'SUDONE PASS',
    src: '/assets/profile/sudone-pass.png',
  },
  --- FIN: OCULTAR BOTÓN SUDONE PASS --- */
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
        {profileButtons.map((button) => (
          <button
            key={button.view}
            className="transition-transform hover:scale-105"
            onClick={() => setView(button.view)}
            aria-label={button.label}
          >
            {/* ¡CORREGIDO! Se añade el estilo para mantener la proporción */}
            <Image 
              src={button.src} 
              alt={button.alt} 
              width={150} 
              height={50} 
              style={{ height: 'auto' }} 
            />
          </button>
        ))}
      </CardContent>
    </Card>
  );
};
