\'use client\';

import { useParams } from \'next/navigation\';
import { RosterManager } from "@/components/team/RosterManager";
import { PageHeader } from \'@/components/page-header\';

// --- Punto Clave de Mentoría: Rutas Dinámicas y Hooks ---
// El nombre de la carpeta `[teamId]` indica una ruta dinámica.
// En componentes de cliente (`\'use client\`), la forma moderna y recomendada
// para acceder a estos parámetros es con el hook `useParams`.
// Esto desacopla nuestro componente de la forma en que Next.js le pasa las props.

export default function ManageTeamPage() {
  // Usamos el hook para obtener todos los parámetros de la URL.
  const params = useParams();
  // Extraemos teamId. Lo tratamos como `string` porque nuestra estructura de ruta así lo define.
  const teamId = params.teamId as string;

  // Es buena práctica manejar el caso donde el teamId aún no esté disponible.
  if (!teamId) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <PageHeader title="Cargando..." description="Obteniendo información del equipo." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader 
        title="Gestionar Plantilla"
        description={`Añade o quita jugadores del equipo con ID: ${teamId}`}
      />
      <div className="mt-8">
        <RosterManager teamId={teamId} />
      </div>
    </div>
  );
}
