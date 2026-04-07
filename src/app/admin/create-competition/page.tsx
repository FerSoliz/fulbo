'use client';

import { useState, useMemo } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Save,
  Loader2,
  Calendar as CalendarIcon,
  Trash2,
  PlusCircle
} from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { TeamSearch } from '@/components/search/TeamSearch';
import { TeamSummary } from '@/lib/firebase/db';
import { Slider } from '@/components/ui/slider';
import { canAccessAdminPanel } from '@/lib/auth/roles';

type TournamentType = 'Liga' | 'Copa';
type TournamentFormat = '5v5' | '6v6' | '7v7' | '8v8' | '11v11';

export default function CreateCompetitionPage() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Detalles del Torneo
  const [competitionName, setCompetitionName] = useState('');
  const [venue, setVenue] = useState('');
  const [competitionType, setCompetitionType] = useState<TournamentType>('Liga');
  const [competitionFormat, setCompetitionFormat] = useState<TournamentFormat>('7v7');
  const [startDate, setStartDate] = useState<Date>();
  const [tournamentSize, setTournamentSize] = useState(8); // NUEVO: Estado para la capacidad del torneo

  // Gestión de Equipos
  const [selectedTeams, setSelectedTeams] = useState<TeamSummary[]>([]);
  const [newTeamNames, setNewTeamNames] = useState<string[]>(['']);

  if (user && !canAccessAdminPanel(user)) {
      router.push('/');
  }

  const handleTeamSelected = (team: TeamSummary) => {
    if (selectedTeams.length + newTeamNames.filter(Boolean).length >= tournamentSize) {
        toast({ title: "Límite alcanzado", description: "No puedes añadir más equipos que la capacidad del torneo.", variant: "destructive"});
        return;
    }
    if (!selectedTeams.some(t => t.id === team.id)) {
      setSelectedTeams(prev => [...prev, team]);
    }
  };

  const handleRemoveSelectedTeam = (teamId: string) => {
    setSelectedTeams(prev => prev.filter(t => t.id !== teamId));
  };
  
  const excludedTeamIds = useMemo(() => selectedTeams.map(t => t.id), [selectedTeams]);

  const handleNewTeamNameChange = (index: number, name: string) => {
    const updatedNames = [...newTeamNames];
    updatedNames[index] = name;
    setNewTeamNames(updatedNames);
  };

  const addMoreNewTeam = () => {
    if (selectedTeams.length + newTeamNames.filter(Boolean).length >= tournamentSize) {
        toast({ title: "Límite alcanzado", description: "No puedes añadir más equipos que la capacidad del torneo.", variant: "destructive"});
        return;
    }
    setNewTeamNames(prev => [...prev, '']);
  }

  const removeNewTeam = (index: number) => {
    if (newTeamNames.length > 1) {
        setNewTeamNames(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSaveCompetition = async () => {
    if (!competitionName.trim() || !venue.trim() || !startDate) {
      toast({ title: "Error de validación", description: "Nombre, sede y fecha de inicio son obligatorios.", variant: "destructive" });
      return;
    }

    const validNewTeams = newTeamNames.map(name => name.trim()).filter(Boolean);
    const totalTeams = selectedTeams.length + validNewTeams.length;

    if (totalTeams > tournamentSize) {
      toast({ title: "Límite de equipos excedido", description: `Has añadido ${totalTeams} equipos, pero la capacidad del torneo es de ${tournamentSize}.`, variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const updates: { [key: string]: any } = {};
      const newTournamentRef = push(ref(db, 'tournaments'));
      const tournamentId = newTournamentRef.key;
      if (!tournamentId) throw new Error("No se pudo generar el ID para el torneo");

      const teamsForTournament: { [key: string]: boolean } = {};

      // CORRECCIÓN: Usar la nueva estructura de datos para equipos existentes.
      selectedTeams.forEach(team => {
        updates[`/teams/${team.id}/tournaments/${tournamentId}`] = true;
        teamsForTournament[team.id] = true;
      });

      // CORRECCIÓN: Usar la nueva estructura de datos para equipos nuevos.
      validNewTeams.forEach(teamName => {
          const newTeamRef = push(ref(db, `teams`));
          const teamId = newTeamRef.key;
          if (!teamId) return;
          const newTeamData = {
              id: teamId,
              name: teamName,
              logoUrl: `https://avatar.vercel.sh/${encodeURIComponent(teamName)}.png`,
              tournaments: { [tournamentId]: true }, // Estructura correcta
              createdAt: serverTimestamp()
          };
          updates[`/teams/${teamId}`] = newTeamData;
          teamsForTournament[teamId] = true;
      });

      const newTournamentData = {
        id: tournamentId,
        name: competitionName,
        venue: venue, 
        type: competitionType,
        format: competitionFormat,
        size: tournamentSize, // GUARDAMOS LA CAPACIDAD MÁXIMA
        teamCount: totalTeams, // GUARDAMOS LOS INSCRITOS INICIALMENTE
        status: 'upcoming',
        startDate: startDate.toISOString(),
        createdAt: serverTimestamp(),
        teams: teamsForTournament,
      };

      updates[`/tournaments/${tournamentId}`] = newTournamentData;

      await update(ref(db), updates);

      toast({ title: "¡Competencia Creada!", description: "El nuevo torneo y sus equipos se han guardado con éxito." });
      router.push(`/admin/tournaments/${tournamentId}/teams`);

    } catch (error) {
        console.error("Error guardando la competencia en RTDB: ", error);
        toast({ title: "Error en la base de datos", description: `Hubo un problema al crear la competencia.`, variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  };

  const currentTeamCount = selectedTeams.length + newTeamNames.filter(Boolean).length;

  if (!user || !canAccessAdminPanel(user)) {
    return <div className="p-8 text-center">Acceso denegado. Redirigiendo...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin/manage-tournaments">
          {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */
          }
          <Button variant="outline" className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" />Volver a Administrar Torneos</Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Crear Nueva Competencia</CardTitle>
            <CardDescription>Completa los detalles para configurar tu nuevo torneo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            {/* ... Campos de detalles del torneo  */}
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
                <div className="space-y-3"><Label className="text-base font-semibold">Tipo</Label><Select value={competitionType} onValueChange={(value: string) => setCompetitionType(value as TournamentType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Liga">Liga</SelectItem><SelectItem value="Copa">Copa</SelectItem></SelectContent></Select></div>
                <div className="space-y-3"><Label className="text-base font-semibold">Formato</Label><Select value={competitionFormat} onValueChange={(value: string) => setCompetitionFormat(value as TournamentFormat)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="5v5">Fútbol 5</SelectItem><SelectItem value="6v6">Fútbol 6</SelectItem><SelectItem value="7v7">Fútbol 7</SelectItem><SelectItem value="8v8">Fútbol 8</SelectItem><SelectItem value="11v11">Fútbol 11</SelectItem></SelectContent></Select></div>
                <div className="space-y-3"><Label className="text-base font-semibold">Fecha de Inicio</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!startDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{startDate ? format(startDate, "PPP", { locale: es }) : <span>Elige una fecha</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus/></PopoverContent></Popover></div>
            </div>

            {/* SECCIÓN DE EQUIPOS REESTRUCTURADA CON SLIDER Y PESTAÑAS */}
            <div className="pt-6 border-t">
                <div className="space-y-4">
                    <Label htmlFor="tournament-size" className="text-lg font-semibold">Capacidad del Torneo: {tournamentSize} equipos</Label>
                    <div className="flex items-center gap-4">
                        <Slider id="tournament-size" min={2} max={32} step={2} value={[tournamentSize]} onValueChange={(v) => setTournamentSize(v[0])} disabled={isLoading} />
                        <span className="font-bold text-lg w-12 text-center">{tournamentSize}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Define el número máximo de equipos. Actualmente has añadido {currentTeamCount} de {tournamentSize}.</p>
                </div>

                <div className="mt-6">
                    <Tabs defaultValue="existing">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="existing">Añadir Existentes ({selectedTeams.length})</TabsTrigger>
                            <TabsTrigger value="new">Crear Nuevos ({newTeamNames.filter(Boolean).length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="existing" className="pt-4">
                            <TeamSearch onTeamSelected={handleTeamSelected} excludedTeamIds={excludedTeamIds} disabled={isLoading || currentTeamCount >= tournamentSize} />
                            <div className="mt-4 space-y-2"> {selectedTeams.map(team => (<div key={team.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg"><div className="flex items-center gap-3"><Avatar className="h-8 w-8 border"><AvatarImage src={team.logoUrl} alt={team.name} /><AvatarFallback>{team.name.charAt(0)}</AvatarFallback></Avatar><p className="font-medium">{team.name}</p></div><Button variant="ghost" size="icon" onClick={() => handleRemoveSelectedTeam(team.id)} disabled={isLoading}><Trash2 className="h-4 w-4 text-destructive"/><span className="sr-only">Quitar</span></Button></div>))} {selectedTeams.length === 0 && <p className="text-center text-sm text-muted-foreground pt-4">Usa el buscador para añadir equipos.</p>}</div>
                        </TabsContent>
                        <TabsContent value="new" className="pt-4 space-y-3">
                            {newTeamNames.map((name, index) => (<div key={index} className="flex items-center gap-2"><Input value={name} onChange={(e) => handleNewTeamNameChange(index, e.target.value)} placeholder={`Nombre nuevo equipo ${index + 1}`} disabled={isLoading || currentTeamCount >= tournamentSize && name === ''} /><Button variant="ghost" size="icon" onClick={() => removeNewTeam(index)} disabled={isLoading || newTeamNames.length <= 1}><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive"/></Button></div>))}
                            <Button variant="outline" size="sm" onClick={addMoreNewTeam} disabled={isLoading || currentTeamCount >= tournamentSize}><PlusCircle className="mr-2 h-4 w-4" />Añadir otro</Button>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
            
            <div className="flex justify-end pt-6 border-t">
              <Button onClick={handleSaveCompetition} disabled={isLoading} size="lg">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isLoading ? 'Creando Torneo...' : `Crear Torneo (${currentTeamCount}/${tournamentSize} equipos)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
