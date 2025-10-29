// src/app/transfer-market/page.tsx

import { getTransferListPlayers } from '@/lib/firebase/db/users';
import { User } from '@/lib/types';
import { TransferPlayerCard } from '@/components/market/TransferPlayerCard';

export const metadata = {
  title: 'Mercado de Pases | SudOne',
  description: 'Jugadores disponibles para fichar en SudOne.',
};

export const dynamic = 'force-dynamic';

export default async function TransferMarketPage() {
  const players: User[] = await getTransferListPlayers();

  return (
    // --- AJUSTE RESPONSIVO ---
    // Reducimos el padding horizontal en móvil (px-2) y lo restauramos en desktop (md:px-4)
    <div className="container mx-auto px-2 md:px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Mercado de Pases
        </h1>
        <p className="text-lg text-gray-400 mt-2">
          Encuentra jugadores libres y oportunidades de traspaso.
        </p>
      </header>

      <main>
        {players.length > 0 ? (
          <div className="flex flex-col gap-2">
            {players.map((player) => (
              <TransferPlayerCard
                key={player.id}
                player={player}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500">
              Actualmente no hay jugadores en el mercado de pases.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
