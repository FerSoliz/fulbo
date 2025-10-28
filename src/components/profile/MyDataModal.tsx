'use client';

import { useState } from 'react';
import { User, PlayingPosition, Surface } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MyDataModalProps {
  profileUser: User;
  onClose: () => void;
  onSave: (updatedData: Partial<User>) => void;
}

const positions: PlayingPosition[] = ['arquero', 'defensa', 'mediocampo', 'lateral', 'delantero', 'otro'];
const surfaces: Surface[] = ['sintetico', 'piso', 'once'];

// Mapeo para mostrar los nombres en español
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

export function MyDataModal({ profileUser, onClose, onSave }: MyDataModalProps) {
  const [age, setAge] = useState(profileUser.age || '');
  const [phone, setPhone] = useState(profileUser.phone || '');
  const [position, setPosition] = useState<PlayingPosition | undefined>(profileUser.playingPosition);
  const [preferredSurfaces, setPreferredSurfaces] = useState(profileUser.preferredSurfaces || {});

  const handleSurfaceToggle = (surface: Surface) => {
    setPreferredSurfaces(prev => ({ ...prev, [surface]: !prev[surface] }));
  };

  const handleSaveChanges = () => {
    const updatedData: Partial<User> = {
      age: Number(age),
      phone,
      playingPosition: position,
      preferredSurfaces,
    };
    onSave(updatedData);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-secondary border-border-soft text-white">
        <DialogHeader>
          <DialogTitle>Mis Datos</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Edad</Label>
              <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} className="bg-secondary border-border-soft" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-secondary border-border-soft" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Posición de Juego</Label>
            <Select value={position} onValueChange={(value: PlayingPosition) => setPosition(value)}>
              <SelectTrigger className="bg-secondary border-border-soft">
                <SelectValue placeholder="Selecciona tu posición" />
              </SelectTrigger>
              <SelectContent className="bg-secondary border-border-soft text-white">
                {positions.map(pos => (
                  <SelectItem key={pos} value={pos} className="capitalize">
                    {positionTranslations[pos]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Superficies Preferidas</Label>
            <div className="flex flex-wrap gap-2">
              {surfaces.map(surface => (
                <Badge
                  key={surface}
                  variant={preferredSurfaces[surface] ? 'default' : 'outline'}
                  onClick={() => handleSurfaceToggle(surface)}
                  className={cn(
                    'cursor-pointer transition-colors',
                    preferredSurfaces[surface] && 'bg-accent-red text-white'
                  )}
                >
                  {surfaceTranslations[surface]}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="bg-secondary border-border-soft hover:bg-container">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
