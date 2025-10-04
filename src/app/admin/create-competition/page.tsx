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
  Calendar as CalendarIcon
} from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, push, update, serverTimestamp } from 'firebase/database';
import { useUser } from '@/context/user-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

// MODIFICACIÓN: Añadidos nuevos formatos de torneo
type TournamentType = 'Liga' | 'Copa';
type TournamentFormat = '5v5' | '6v6' | '7v7' | '8v8' | '11v11';

export default function CreateCompetitionPage() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [competitionName, setCompetitionName] = useState('');
  const [venue, setVenue] = useState('');
  const [competitionType, setCompetitionType] = useState<TournamentType>('Liga');
  const [competitionFormat, setCompetitionFormat] = useState<TournamentFormat>('7v7');
  const [startDate, setStartDate] = useState<Date>();
  // MODIFICACIÓN: La cantidad inicial de equipos ahora es 4
  const [teamCount, setTeamCount] = useState(4);
  const [teamNames, setTeamNames] = useState<string[]>(Array(4).fill(''));
  const [isLoading, setIsLoading] = useState(false);

  if (user && user.role !== 'admin') {
      router.push('/');
  }

  const handleTeamCountChange = (value: number) => {
    const newCount = Math.max(2, Math.min(32, value));
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
    if (!venue.trim()) { 
        toast({ title: "Error de validación", description: "La sede de la competencia es obligatoria.", variant: "destructive" });
        return;
    }
    if (!startDate) {
        toast({ title: "Error de validación", description: "Debes seleccionar una fecha de inicio para el torneo.", variant: "destructive" });
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
      const newTournamentRef = push(ref(db, 'tournaments'));
      const tournamentId = newTournamentRef.key;

      if (!tournamentId) throw new Error("No se pudo generar el ID para el torneo");

      const teamsForTournament: { [key: string]: boolean } = {};

      validTeams.forEach(teamName => {
          const newTeamRef = push(ref(db, `teams`));
          const teamId = newTeamRef.key;
          if (!teamId) return;

          updates[`/teams/${teamId}`] = {
              id: teamId,
              name: teamName,
              logoUrl: `https://avatar.vercel.sh/${encodeURIComponent(teamName)}.png`,
              tournamentId: tournamentId,
              createdAt: serverTimestamp(),
          };

          teamsForTournament[teamId] = true;
      });

      const newTournamentData = {
        id: tournamentId,
        name: competitionName,
        venue: venue, 
        type: competitionType,
        format: competitionFormat,
        teamCount: teamCount,
        status: 'upcoming',
        startDate: startDate.toISOString(),
        createdAt: serverTimestamp(),
        teams: teamsForTournament,
      };

      updates[`/tournaments/${tournamentId}`] = newTournamentData;

      await update(ref(db), updates);

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="competition-name" className="text-base font-semibold">Nombre de la Competencia</Label>
                <Input id="competition-name" value={competitionName} onChange={(e) => setCompetitionName(e.target.value)} placeholder="Ej: Copa SudOne - Apertura 2024" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue" className="text-base font-semibold">Sede</Label>
                <Input id="venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Ej: La Bombonera" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Tipo</Label>
                  <Select value={competitionType} onValueChange={(value: string) => setCompetitionType(value as TournamentType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Liga">Liga</SelectItem>
                            <SelectItem value="Copa">Copa</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Formato</Label>
                   <Select value={competitionFormat} onValueChange={(value: string) => setCompetitionFormat(value as TournamentFormat)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {/* MODIFICACIÓN: Añadidos nuevos formatos */}
                            <SelectItem value="5v5">Fútbol 5</SelectItem>
                            <SelectItem value="6v6">Fútbol 6</SelectItem>
                            <SelectItem value="7v7">Fútbol 7</SelectItem>
                            <SelectItem value="8v8">Fútbol 8</SelectItem>
                            <SelectItem value="11v11">Fútbol 11</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-3">
                    <Label className="text-base font-semibold">Fecha de Inicio</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
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
