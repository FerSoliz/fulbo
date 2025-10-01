'use client';

import { useState, useEffect } from 'react';
import { RosterManager } from '@/components/team/RosterManager';
import { useUser } from '@/context/user-context';
import { getTeamDetails, TeamDetails } from '@/lib/firebase/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

// --- Componente de Esqueleto para el Encabezado ---
function TeamHeaderSkeleton() {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center space-x-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Encabezado del Equipo ---
function TeamHeader({ team }: { team: TeamDetails }) {
  return (
    <Card className="mb-6 shadow-lg border-primary/20">
        <CardContent className="p-6">
            <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24 border-2 border-primary/50">
                    <AvatarImage src={team.logoUrl} alt={`Logo de ${team.name}`} />
                    <AvatarFallback className="text-3xl font-bold">
                        {team.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <h2 className="text-4xl font-extrabold tracking-tight text-primary">{team.name}</h2>
                    <p className="text-lg text-muted-foreground">
                        Bienvenido al centro de mando de tu equipo, Capitán.
                    </p>
                </div>
            </div>
        </CardContent>
    </Card>
  );
}


export default function ManageTeamPage() {
  const { user, loading: userLoading } = useUser();
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [headerLoading, setHeaderLoading] = useState(true);

  useEffect(() => {
    async function fetchTeamData() {
      if (user?.teamId) {
        setHeaderLoading(true);
        try {
          const details = await getTeamDetails(user.teamId);
          if (details) {
            setTeamDetails(details);
          }
        } catch (error) {
          console.error("Error al cargar los detalles del equipo:", error);
        } finally {
          setHeaderLoading(false);
        }
      }
    }

    if (!userLoading) {
      fetchTeamData();
    }
  }, [user, userLoading]);

  // Estado de carga principal
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Guardia de acceso
  if (user?.role !== 'Captain' || !user.teamId) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription className="text-center">
            Debes ser capitán de un equipo para acceder a esta página.
          </Al`ertDescription>
        </Alert>
      </div>
    );
  }

  // Página principal
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {headerLoading ? (
        <TeamHeaderSkeleton />
      ) : teamDetails ? (
        <TeamHeader team={teamDetails} />
      ) : (
        // Fallback si no se encuentran los detalles del equipo, aunque es poco probable.
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Gestionar Equipo</CardTitle>
          </CardHeader>
        </Card>
      )}

      <RosterManager teamId={user.teamId} />
    </div>
  );
}
