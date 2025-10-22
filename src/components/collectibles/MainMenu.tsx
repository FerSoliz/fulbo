'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CardPack } from '@/components/card-pack';
import { User } from '@/lib/types';

interface MainMenuProps {
  onOpenPack: () => void;
  availablePacks: number;
  countdown: string;
  user: User | null;
}

export const MainMenu = ({ onOpenPack, availablePacks, countdown, user }: MainMenuProps) => {
  const isVisitor = user?.id === 'visitor';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      <Image
        src="https://i.postimg.cc/hG6rcV44/FONDO-JUEGUITO.jpg"
        alt="Fondo del juego de cartas"
        layout="fill"
        objectFit="cover"
        className="z-0"
        priority
      />
      <div className="relative z-10 bg-card/70 backdrop-blur-sm p-4 rounded-lg w-96">
        <div className="flex flex-col items-center">
          <CardPack />
          <Button
            onClick={onOpenPack}
            disabled={isVisitor || availablePacks <= 0}
            className="mt-4 w-60"
          >
            {availablePacks > 0 ? `ABRIR SOBRE (${availablePacks})` : countdown ? `PRÓXIMO SOBRE EN ${countdown}` : 'NO HAY SOBRES'}
          </Button>
        </div>
      </div>
      <div className="relative z-10 mt-6 w-full flex justify-center gap-4">
        <button className="transition-transform hover:scale-105 drop-shadow-lg" disabled>
          <Image
            src="https://i.postimg.cc/t4NZKwwX/SHOP-CARD.png"
            alt="Tienda de cartas"
            width={154}
            height={154}
          />
        </button>
        <button className="transition-transform hover:scale-105 drop-shadow-lg" disabled>
          <Image
            src="https://i.postimg.cc/0QRpxDZv/BOTON-VS.png"
            alt="Modo VS"
            width={154}
            height={154}
          />
        </button>
      </div>
      {/* El botón de misiones ha sido eliminado para evitar confusión */}
    </div>
  );
};
