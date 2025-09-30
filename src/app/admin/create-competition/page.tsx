'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Save,
  Loader2,
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
// Importaciones corregidas para Realtime Database
import { rtdb, ref, push, update, serverTimestamp } from '@/lib/firebase';
import { useUser } from '@/context/user-context';

type TournamentType = 'Liga' | 'Copa';
type TournamentFormat = '5v5' | '7v7' | '11v11';

export default function CreateCompetitionPage() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [competitionName, setCompetitionName] = useState('');
  const [competitionType, setCompetitionType] = useState<TournamentType>('Liga');
  const [competitionFormat, setCompetitionFormat] = useState<TournamentFormat>('7v7');
  const [teamCount, setTeamCount] = useState(8);
  const [teamNames, setTeamNames] = useState<string[]>(Array(8).fill(''));
  const [isLoading, setIsLoading] = useState(false);

  // Protección de ruta
  if (user && user.role !== 'admin') {
      router.push('/');
  }

  const handleTeamCountChange = (value: number) => {
    const newCount = Math.max(2, Math.min(32, value)); // Mínimo 2 equipos, máximo 32
    setTeamCount(newCount);
    const newTeamNames = Array(newCount).fill('');
    teamNames.slice(0, newCount).forEach((name, i) => {
      newTeamNames[i] = name;
    });
    setTeamNames(newTeamNames);
  };

  const handleTeamNameChange = (index: number, name: string) => {
    const newTeamNames = [...teamNames];
    newTeamNames[index] = name;
    setTeamNames(newTeamNames);
  };

  const handleSaveCompetition = async () => {
    if (!competitionName.trim()) {
        toast({ title: "Error de validación", description: "El nombre de la competencia es obligatorio.", variant: "destructive" });
        return;
    }

    const validTeams = teamNames.map(name => name.trim()).filter(name => name !== '');
    if (validTeams.length !== teamCount) {
        toast({ title: "Error de validación", description: `Se esperan ${teamCount} nombres de equipos, pero solo ${validTeams.length} son válidos.`, variant: "destructive" });
        return;
    }

    setIsLoading(true);

    try {
      const updates: { [key: string]: any } = {};
      
      // 1. Generar ID único para el nuevo torneo
      const newTournamentRef = push(ref(rtdb, 'tournaments'));
      const tournamentId = newTournamentRef.key;

      if (!tournamentId) throw new Error("No se pudo generar el ID para el torneo");

      // 2. Preparar el objeto de equipos que irá DENTRO del torneo
      const teamsForTournament: { [key: string]: boolean } = {};

      // 3. Iterar sobre los nombres de equipo para llenar las actualizaciones
      validTeams.forEach(teamName => {
          const newTeamRef = push(ref(rtdb, `teams`)); // Genera un ID único en la rama global de equipos
          const teamId = newTeamRef.key;
          if (!teamId) return; // Salta si no se pudo crear el ID del equipo

          // Añade la creación del equipo a la rama global /teams/
          updates[`/teams/${teamId}`] = {
              id: teamId,
              name: teamName,
              logoUrl: `https://avatar.vercel.sh/${encodeURIComponent(teamName)}.png`,
              tournamentId: tournamentId, // Enlace de vuelta al torneo
              createdAt: serverTimestamp(),
          };

          // Añade el ID del equipo a la lista del torneo
          teamsForTournament[teamId] = true;
      });

      // 4. Construir el objeto del torneo completo, incluyendo el objeto de equipos
      const newTournamentData = {
        id: tournamentId,
        name: competitionName,
        type: competitionType,
        format: competitionFormat,
        teamCount: teamCount,
        status: 'upcoming',
        startDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        teams: teamsForTournament, // Objeto de equipos anidado
      };

      // 5. Añadir la creación del torneo a la ruta /tournaments/
      updates[`/tournaments/${tournamentId}`] = newTournamentData;

      // 6. Ejecutar la actualización atómica (sin conflictos de ancestros)
      await update(ref(rtdb), updates);

      toast({
        title: "¡Competencia Creada!",
        description: "El nuevo torneo y sus equipos se han guardado con éxito.",
      });
      router.push('/admin/manage-tournaments');

    } catch (error) {
        console.error("Error guardando la competencia en RTDB: ", error);
        toast({
          title: "Error en la base de datos",
          description: `Hubo un problema al crear la competencia: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          variant: "destructive"
        });
    } finally {
        setIsLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="p-8 text-center">Acceso denegado. Redirigiendo...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin/manage-tournaments">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Administrar Torneos
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Crear Nueva Competencia</CardTitle>
            <CardDescription>Completa los detalles para configurar tu nuevo torneo y sus equipos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <div className="space-y-2">
              <Label htmlFor="competition-name" className="text-lg font-semibold">Nombre de la Competencia</Label>
              <Input id="competition-name" value={competitionName} onChange={(e) => setCompetitionName(e.target.value)} placeholder="Ej: Copa SudOne - Apertura 2024" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Tipo</Label>
                  <RadioGroup value={competitionType} onValueChange={(value: string) => setCompetitionType(value as TournamentType)} className="flex gap-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Liga" id="type-liga" /><Label htmlFor="type-liga">Liga</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Copa" id="type-copa" /><Label htmlFor="type-copa">Copa</Label></div>
                  </RadioGroup>
                </div>
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Formato</Label>
                   <Select value={competitionFormat} onValueChange={(value: string) => setCompetitionFormat(value as TournamentFormat)}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar formato" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5v5">Fútbol 5</SelectItem>
                            <SelectItem value="7v7">Fútbol 7</SelectItem>
                            <SelectItem value="11v11">Fútbol 11</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="team-count" className="text-lg font-semibold">Cantidad de Equipos: {teamCount}</Label>
              <div className="flex items-center gap-4">
                <Slider id="team-count" min={2} max={32} step={2} value={[teamCount]} onValueChange={(value) => handleTeamCountChange(value[0])} />
                <span className="font-bold text-lg w-12 text-center">{teamCount}</span>
              </div>
            </div>

            {teamCount > 0 && (
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Nombres de los Equipos</Label>
                 <p className="text-sm text-muted-foreground">Introduce el nombre de cada equipo participante.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamNames.map((name, index) => (
                    <Input key={index} value={name} onChange={(e) => handleTeamNameChange(index, e.target.value)} placeholder={`Equipo ${index + 1}`} />
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-6 border-t">
              <Button onClick={handleSaveCompetition} disabled={isLoading} size="lg">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isLoading ? 'Creando Torneo...' : 'Crear Torneo y Equipos'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
