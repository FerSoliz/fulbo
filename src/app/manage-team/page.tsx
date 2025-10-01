'use client';

import { RosterManager } from '@/components/team/RosterManager';
import { useUser } from '@/context/user-context';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function ManageTeamPage() {
  const { user, loading } = useUser();

  // Estado de carga del contexto de usuario
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="sr-only">Cargando datos del usuario...</p>
      </div>
    );
  }

  // El usuario no es capitán o no tiene equipo asignado
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

  // Renderiza el gestor de plantilla si el usuario es capitán y tiene equipo
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Gestionar Equipo</CardTitle>
          <CardDescription>
            Añade o quita jugadores de tu plantilla. Busca por DNI para encontrar jugadores registrados o añádelos como invitados.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* El componente RosterManager se encargará de toda la lógica */}
      <RosterManager teamId={user.teamId} />
    </div>
  );
}
