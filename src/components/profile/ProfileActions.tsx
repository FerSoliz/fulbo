'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

export type ProfileView = 'buttons' | 'history' | 'stats' | 'next_match' | 'sudone_pass' | 'ranking_preview' | 'favorite_tournaments' | 'my_team';

// 1. La interfaz de props ahora requiere la pestaña activa
interface ProfileActionsProps {
  setView: (view: ProfileView) => void;
  activeTab: 'perfil' | 'equipo';
}

// 2. Añadimos la propiedad 'tab' a cada botón para la distribución
const profileButtons = [
  {
    view: 'stats' as ProfileView,
    label: 'Ver estadísticas',
    alt: 'Estadísticas',
    src: '/assets/profile/estadisticas.png',
    tab: 'perfil',
  },
  {
    view: 'favorite_tournaments' as ProfileView,
    label: 'Ver torneos favoritos',
    alt: 'Torneos Favoritos',
    src: '/assets/profile/torneos-favoritos.png',
    tab: 'perfil',
  },
    {
    view: 'ranking_preview' as ProfileView,
    label: 'Ver ranking de jugadores',
    alt: 'Ranking',
    src: '/assets/profile/ranking.png',
    tab: 'perfil',
  },
  {
    view: 'history' as ProfileView,
    label: 'Ver historial de partidos',
    alt: 'Historial',
    src: '/assets/profile/historial.png',
    tab: 'equipo',
  },
  {
    view: 'next_match' as ProfileView,
    label: 'Ver próximo partido',
    alt: 'Próximo Partido',
    src: '/assets/profile/proximo-partido.png',
    tab: 'equipo',
  },
  {
    view: 'my_team' as ProfileView,
    label: 'Ver mi equipo',
    alt: 'Mi Equipo',
    src: '/assets/profile/mi-equipo.png',
    tab: 'equipo',
  },
];

export const ProfileActions = ({ setView, activeTab }: ProfileActionsProps) => {
  // 3. Filtramos los botones según la pestaña activa
  const buttonsForTab = profileButtons.filter(button => button.tab === activeTab);

  return (
    <Card>
      {/* 4. Ajustamos la grilla a 3 columnas para un diseño equilibrado */}
      <CardContent className="p-4 grid grid-cols-3 gap-4">
        {buttonsForTab.map((button) => (
          <button
            key={button.view}
            className="transition-transform hover:scale-105"
            onClick={() => setView(button.view)}
            aria-label={button.label}
          >
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
