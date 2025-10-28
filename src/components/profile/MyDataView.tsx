'use client';

import { User, Surface, PlayingPosition } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MyDataViewProps {
  profileUser: User;
  onClose: () => void;
}

// Mapeos para mostrar los nombres en español y con mayúsculas
const surfaceTranslations: Record<Surface, string> = {
  sintetico: 'Sintético',
  piso: 'Piso',
  once: 'Fútbol 11',
};

const positionTranslations: Record<PlayingPosition, string> = {
  arquero: 'Arquero',
  defensa: 'Defensa',
  mediocampo: 'Mediocampo',
  lateral: 'Lateral',
  delantero: 'Delantero',
  otro: 'Otro',
};

export function MyDataView({ profileUser, onClose }: MyDataViewProps) {
  const { age, phone, playingPosition, preferredSurfaces = {} } = profileUser;

  const selectedSurfaces = Object.entries(preferredSurfaces)
    .filter(([, isSelected]) => isSelected)
    .map(([surface]) => surface as Surface);

  const dataPoints = [
    { label: 'Edad', value: age || 'No especificada' },
    { label: 'Teléfono', value: phone || 'No especificado' },
    {
      label: 'Posición de Juego',
      value: playingPosition ? positionTranslations[playingPosition] : 'No especificada'
    },
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-secondary/30 backdrop-blur-sm border-border-soft text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Datos de {profileUser.name}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-5">
          {/* Datos principales en formato lista */}
          <div className="space-y-4">
            {dataPoints.map((point) => (
              <div key={point.label} className="flex items-center justify-between border-b border-border-soft pb-3">
                <span className="text-sm text-gray-400">{point.label}</span>
                <span className="font-semibold">{point.value}</span>
              </div>
            ))}
          </div>

          {/* Sección de Superficies Preferidas */}
          <div className="space-y-3">
            <h4 className="text-sm text-gray-400">Superficies Preferidas</h4>
            <div className="flex flex-wrap gap-2">
              {selectedSurfaces.length > 0 ? (
                selectedSurfaces.map(surface => (
                  <Badge
                    key={surface}
                    variant="outline"
                    className="border-accent-red text-white text-sm px-2.5 py-0.5"
                  >
                    {surfaceTranslations[surface]}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-500">No hay superficies preferidas.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border-soft pt-4">
          <DialogClose asChild>
            <Button className="bg-accent-red hover:bg-accent-red/90 text-white">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
