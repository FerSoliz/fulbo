'use client';

import { useParams } from 'next/navigation';
import { RosterManager } from "@/components/team/RosterManager";

export default function ManageTeamPage() {
  const params = useParams();
  const teamId = Array.isArray(params.teamId) ? params.teamId[0] : params.teamId;

  // El estado de carga es más simple ahora, ya que el título lo maneja el layout
  if (!teamId) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Esperando ID del equipo...</p>
      </div>
    );
  }

  return (
    // El div principal ya no necesita padding, el layout lo proporciona
    <div> 
      {/* El PageHeader ha sido eliminado para evitar duplicados */}
      <div className="mt-8">
        <RosterManager teamId={teamId} />
      </div>
    </div>
  );
}
