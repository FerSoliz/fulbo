'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus } from 'lucide-react';

// --- Schema de Validación con Zod ---
const guestPlayerSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }).max(50),
  dni: z.string(), // El DNI no necesita validación aquí porque viene del componente padre
});

type GuestPlayerInput = z.infer<typeof guestPlayerSchema>;

// --- Props del Componente ---
interface AddGuestPlayerFormProps {
  dni: string; // El DNI que no se encontró
  onAddGuest: (name: string, dni: string) => void;
  onCancel: () => void;
}

export function AddGuestPlayerForm({ dni, onAddGuest, onCancel }: AddGuestPlayerFormProps) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<GuestPlayerInput>({
    resolver: zodResolver(guestPlayerSchema),
    defaultValues: {
      name: '',
      dni: dni, // Pre-rellenamos el DNI
    },
  });

  const onSubmit = (data: GuestPlayerInput) => {
    setLoading(true);
    console.log('Añadiendo jugador invitado:', data);

    // Simulación de la operación de guardado
    setTimeout(() => {
      onAddGuest(data.name, data.dni);
      setLoading(false);
    }, 1000);
  };

  return (
    <Card className="bg-secondary/50 border-dashed">
        <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <UserPlus className="h-6 w-6" />
                    <CardTitle>Añadir como Invitado</CardTitle>
                </div>
                <CardDescription>El jugador con DNI {dni} no está registrado. Añádelo con su nombre.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="guest-name">Nombre y Apellido</Label>
                    <Input 
                        id="guest-name" 
                        {...register('name')} 
                        placeholder="Ej: Jorge Campos"
                        disabled={loading}
                    />
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="guest-dni">DNI</Label>
                    <Input id="guest-dni" {...register('dni')} readOnly disabled className="cursor-not-allowed" />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Añadir
                </Button>
            </CardFooter>
        </form>
    </Card>
  );
}
