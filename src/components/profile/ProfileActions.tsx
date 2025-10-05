'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

export type ProfileView = 'buttons' | 'history' | 'stats' | 'next_match' | 'sudone_pass' | 'ranking_preview' | 'favorite_tournaments' | 'my_team';

interface ProfileActionsProps {
  setView: (view: ProfileView) => void;
}

export const ProfileActions = ({ setView }: ProfileActionsProps) => {
  return (
    <Card>
      <CardContent className="p-4 grid grid-cols-4 gap-4">
        <button className="transition-transform hover:scale-105" onClick={() => setView('history')} aria-label="Ver historial de partidos">
          <Image src="https://i.postimg.cc/kMNbHH8f/boton-1.png" alt="Historial" width={150} height={50} />
        </button>
        <button className="transition-transform hover:scale-105" onClick={() => setView('next_match')} aria-label="Ver próximo partido">
          <Image src="https://i.postimg.cc/VsBcb9QJ/proximo-partido.png" alt="Próximo Partido" width={150} height={50} />
        </button>
        <button className="transition-transform hover:scale-105" onClick={() => setView('stats')} aria-label="Ver estadísticas">
          <Image src="https://i.postimg.cc/hjWHXv28/boton-estadisticas.png" alt="Estadísticas" width={150} height={50} />
        </button>
        <button className="transition-transform hover:scale-105" onClick={() => setView('my_team')} aria-label="Ver mi equipo">
          <Image src="https://i.postimg.cc/cLsMSW3v/boton-mi-equipo.png" alt="Mi Equipo" width={150} height={50} />
        </button>
        <button className="transition-transform hover:scale-105" onClick={() => setView('sudone_pass')} aria-label="Ver SUDONE PASS">
          <Image src="https://i.postimg.cc/zfJh8FrT/boton-rojo-pase.png" alt="SUDONE PASS" width={150} height={50} />
        </button>
        <button className="transition-transform hover:scale-105" onClick={() => setView('ranking_preview')} aria-label="Ver ranking de jugadores">
          <Image src="https://i.postimg.cc/VLhYjjGw/BOTON-RANKING.png" alt="Ranking" width={150} height={50} />
        </button>
        <button className="transition-transform hover:scale-105" onClick={() => setView('favorite_tournaments')} aria-label="Ver torneos favoritos">
          <Image src="https://i.postimg.cc/yYnD2Q1z/boton-favorito-torneo.png" alt="Torneos Favoritos" width={150} height={50} />
        </button>
      </CardContent>
    </Card>
  );
};
