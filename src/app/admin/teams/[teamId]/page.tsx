'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RosterManager } from "@/components/team/RosterManager";
import { getTeamDetails, TeamDetails as Team } from '@/lib/firebase/db';
import AnimatedTeamLogo from '@/components/AnimatedTeamLogo'; // Importa el componente actualizado
import { Skeleton } from '@/components/ui/skeleton';

export default function ManageTeamPage() {
  const params = useParams();
  const teamId = Array.isArray(params.teamId) ? params.teamId[0] : params.teamId;
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeam = async () => {
      if (teamId) {
        try {
          setLoading(true);
          const teamData = await getTeamDetails(teamId);
          if (teamData) {
            setTeam(teamData);
          } else {
            setError("Equipo no encontrado.");
          }
        } catch (err) {
          console.error("Error fetching team:", err);
          setError("Error al cargar la información del equipo.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTeam();
  }, [teamId]);

  if (!teamId) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Esperando ID del equipo...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Skeleton className="w-24 h-24 rounded-full" />
        <Skeleton className="w-48 h-8" />
        <Skeleton className="w-full h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {team && (
        <div className="flex flex-col items-center mb-6">
          <AnimatedTeamLogo 
            name={team.name}
            logoUrl={team.logoUrl}
          />
          <h1 className="text-3xl font-bold text-white dark:text-gray-100 mt-4">{team.name}</h1>
        </div>
      )}
      <RosterManager teamId={teamId} />
    </div>
  );
}
