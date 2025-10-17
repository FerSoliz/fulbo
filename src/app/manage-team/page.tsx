'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link'; // <-- Importamos Link para el botón del admin
import { RosterManager } from '@/components/team/RosterManager';
import { useUser } from '@/context/user-context';
import { getTeamDetails, TeamDetails } from '@/lib/firebase/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button'; // <-- Importamos Button
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
// --- Importamos los nuevos íconos ---
import { Loader2, Shield, ArrowRight } from 'lucide-react';

// --- Componente de Esqueleto (sin cambios) ---
function TeamHeaderSkeleton() {
  return (
    <Card className="mb-6"><CardContent className="p-6"><div className="flex items-center space-x-6"><Skeleton className="h-24 w-24 rounded-full" /><div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-5 w-64" /></div></div></CardContent></Card>
  );
}

// --- Encabezado del Equipo (sin cambios) ---
function TeamHeader({ team }: { team: TeamDetails }) {
  return (
    <Card className="mb-6 shadow-lg border-primary/20"><CardContent className="p-6"><div className="flex items-center space-x-6"><Avatar className="h-24 w-24 border-2 border-primary/50"><AvatarImage src={team.logoUrl} alt={`Logo de ${team.name}`} /><AvatarFallback className="text-3xl font-bold">{team.name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar><div className="space-y-1"><h2 className="text-4xl font-extrabold tracking-tight text-primary">{team.name}</h2><p className="text-lg text-muted-foreground">Bienvenido al centro de mando de tu equipo, Capitán.</p></div></div></CardContent></Card>
  );
}


export default function ManageTeamPage() {
  const { user, loading: userLoading } = useUser();
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [headerLoading, setHeaderLoading] = useState(true);

  useEffect(() => {
    async function fetchTeamData() {
      // Solo cargamos los datos del equipo si el usuario es un Capitán
      if (user?.role === 'Captain' && user.teamId) {
        setHeaderLoading(true);
        try {
          const details = await getTeamDetails(user.teamId);
          if (details) setTeamDetails(details);
        } catch (error) {
          console.error("Error al cargar los detalles del equipo:", error);
        } finally {
          setHeaderLoading(false);
        }
      } else {
        setHeaderLoading(false); // Si no es capitán, no hay nada que cargar.
      }
    }

    if (!userLoading) fetchTeamData();
  }, [user, userLoading]);

  // 1. Estado de carga principal
  if (userLoading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  // 2. Guardia de acceso para ADMIN - La nueva lógica inteligente
  if (user?.role === 'admin') {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Card className="max-w-2xl mx-auto bg-blue-50 border-blue-200">
            <CardHeader>
                <div className="flex items-center space-x-4">
                    <Shield className="w-12 h-12 text-blue-600" />
                    <div>
                        <CardTitle className="text-2xl text-blue-800">Vista de Administrador</CardTitle>
                        <CardDescription className="text-blue-700">
                            Esta página es para que los capitanes gestionen su propio equipo.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="mb-4 text-gray-600">
                    Como administrador, tu rol es supervisar todos los equipos del sistema desde un panel centralizado.
                </p>
                <Button asChild>
                    <Link href="/admin/manage-teams" legacyBehavior>
                        Ir al Panel de Administración de Equipos
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  // 3. Guardia de acceso para Capitanes (y otros roles)
  if (user?.role !== 'Captain' || !user.teamId) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription className="text-center">
            Debes ser capitán de un equipo para acceder a esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 4. Página principal para el Capitán
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {headerLoading ? (
        <TeamHeaderSkeleton />
      ) : teamDetails ? (
        <TeamHeader team={teamDetails} />
      ) : (
        <Card className="mb-6"><CardHeader><CardTitle className="text-3xl font-bold">Gestionar Equipo</CardTitle></CardHeader></Card>
      )}

      <RosterManager teamId={user.teamId} />
    </div>
  );
}
