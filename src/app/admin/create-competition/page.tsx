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
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  ChevronRight,
  ClipboardList,
  Save,
  Users,
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { doc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';


type TournamentType = 'LIGA' | 'COPA';
type TournamentFormat =
  | 'todos-contra-todos'
  | 'eliminacion-directa'
  | 'grupos-y-playoffs'
  | 'doble-rueda';


export default function CreateCompetitionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [competitionName, setCompetitionName] = useState('');
  const [competitionType, setCompetitionType] =
    useState<TournamentType>('LIGA');
  const [competitionFormat, setCompetitionFormat] =
    useState<TournamentFormat>('todos-contra-todos');
  const [autoFixture, setAutoFixture] = useState(true);
  const [teamCount, setTeamCount] = useState(8);
  const [teamNames, setTeamNames] = useState<string[]>(
    Array(8).fill('')
  );
  const [groupCount, setGroupCount] = useState(2);
  const [isLoading, setIsLoading] = useState(false);

  const handleTeamCountChange = (value: number) => {
    const newCount = Math.max(0, Math.min(20, value));
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
    if (!competitionName) {
        toast({ title: "Error", description: "El nombre de la competencia es obligatorio.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    const tournamentId = `tournament_${Date.now()}`;
    const newTournament = {
      id: tournamentId,
      name: competitionName,
      type: competitionType,
      format: competitionFormat,
      teamCount: teamCount,
      autoFixture: autoFixture,
      status: 'pending', 
      ...(competitionFormat === 'grupos-y-playoffs' && { groupCount }),
    };

    try {
        const batch = writeBatch(db);

        // Save tournament document
        const tournamentRef = doc(db, 'tournaments', tournamentId);
        batch.set(tournamentRef, newTournament);

        // Save teams subcollection
        const validTeams = teamNames.filter(name => name.trim() !== '');
        validTeams.forEach((teamName, index) => {
            const teamId = `team_${tournamentId}_${teamName.replace(/\s+/g, '_') || index}`;
            const teamRef = doc(db, 'tournaments', tournamentId, 'teams', teamId);
            batch.set(teamRef, {
                id: teamId,
                name: teamName,
                logoUrl: `https://avatar.vercel.sh/${teamName || `Equipo${index}`}.png`
            });
        });

        await batch.commit();

        toast({
          title: "¡Competencia guardada!",
          description: "El nuevo torneo y sus equipos han sido creados con éxito.",
        });
        router.push('/admin/manage-tournaments');

    } catch (error) {
        console.error("Error saving competition: ", error);
        toast({
          title: "Error al guardar",
          description: "Hubo un problema al crear la competencia. Inténtalo de nuevo.",
          variant: "destructive"
        });
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <TooltipProvider>
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Crear Nueva Competencia
            </CardTitle>
            <CardDescription>
              Completa los detalles para configurar tu nuevo torneo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="competition-name" className="text-lg font-semibold">
                Nombre de la Competencia
              </Label>
              <Input
                id="competition-name"
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
                placeholder="Ej: Liga de Verano 2024"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold">Tipo</Label>
              <RadioGroup
                value={competitionType}
                onValueChange={(value: string) =>
                  setCompetitionType(value as TournamentType)
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="LIGA" id="type-liga" />
                  <Label htmlFor="type-liga">LIGA</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="COPA" id="type-copa" />
                  <Label htmlFor="type-copa">COPA</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold">Formato</Label>
              <RadioGroup
                value={competitionFormat}
                onValueChange={(value: string) =>
                  setCompetitionFormat(value as TournamentFormat)
                }
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="todos-contra-todos" id="format-1" />
                  <Label htmlFor="format-1">Liga (Todos contra todos)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="eliminacion-directa" id="format-2" />
                  <Label htmlFor="format-2">Copa (Eliminación directa)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="grupos-y-playoffs" id="format-3" />
                  <Label htmlFor="format-3">Fase de Grupos y Playoffs</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="doble-rueda" id="format-4" />
                  <Label htmlFor="format-4">Liga Doble Rueda</Label>
                </div>
              </RadioGroup>
               {competitionFormat === 'grupos-y-playoffs' && (
                <div className="pl-6 pt-2">
                    <Label htmlFor="group-count">Cantidad de Grupos</Label>
                     <Select
                        value={String(groupCount)}
                        onValueChange={(value) => setGroupCount(Number(value))}
                    >
                        <SelectTrigger id="group-count" className="w-[180px]">
                            <SelectValue placeholder="Seleccionar grupos" />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 16 }, (_, i) => i + 1).map(num => (
                                <SelectItem key={num} value={String(num)}>
                                    {num} {num === 1 ? 'Grupo' : 'Grupos'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
               )}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="auto-fixture" className="text-lg font-semibold">
                    Crear Fixture Automático
                  </Label>
                   <p className="text-sm text-muted-foreground">Genera todos los partidos al crear el torneo. Si se desactiva, podrás crearlo manualmente más tarde.</p>
                </div>
              <Switch
                id="auto-fixture"
                checked={autoFixture}
                onCheckedChange={setAutoFixture}
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="team-count" className="text-lg font-semibold">
                Cantidad de Equipos: {teamCount}
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="team-count"
                  min={0}
                  max={20}
                  step={1}
                  value={[teamCount]}
                  onValueChange={(value) => handleTeamCountChange(value[0])}
                />
                <Input
                  type="number"
                  className="w-20"
                  value={teamCount}
                  onChange={(e) => handleTeamCountChange(Number(e.target.value))}
                  min={0}
                  max={20}
                />
              </div>
            </div>

            {teamCount > 0 && (
              <div className="space-y-4">
                <Label className="text-lg font-semibold">
                  Nombres de los Equipos
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamNames.map((name, index) => (
                    <Input
                      key={index}
                      value={name}
                      onChange={(e) =>
                        handleTeamNameChange(index, e.target.value)
                      }
                      placeholder={`Equipo ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSaveCompetition} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Guardando...' : 'Guardar Competencia'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </TooltipProvider>
  );
}
