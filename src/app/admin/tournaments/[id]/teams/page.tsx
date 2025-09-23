'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Users,
  Pen,
  Trash2,
  Check,
  PlusCircle,
  Upload,
  UserPlus,
  KeyRound,
  Loader2,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { useUpload } from '@/hooks/use-upload';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  logoUrl?: string;
}

interface Player {
  id: string;
  dni: string;
  name: string;
  lastName: string;
  age: string;
  nationality: string;
  phone: string;
  address: string;
  email: string;
}

export default function ManageTeamsPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = params.id as string;
  const { uploadFile, isUploading } = useUpload();
  const { toast } = useToast();

  const [tournamentName, setTournamentName] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<Player[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [teamToUpdateLogo, setTeamToUpdateLogo] = useState<string | null>(null);
   const [uploadingLogoId, setUploadingLogoId] = useState<string | null>(null);

  useEffect(() => {
    // Load tournament name
    const allTournaments = JSON.parse(
      localStorage.getItem('tournaments') || '[]'
    );
    const currentTournament = allTournaments.find((t: any) => t.id === tournamentId);
    if (currentTournament) {
      setTournamentName(currentTournament.name);
    } else {
      router.push('/admin/manage-tournaments');
      return;
    }

    // Load teams for this tournament
    const teamNamesJson = localStorage.getItem(`teams_${tournamentId}`);
    if (teamNamesJson) {
      const teamNames = JSON.parse(teamNamesJson);
      const teamLogos = JSON.parse(localStorage.getItem(`logos_${tournamentId}`) || '{}');
      const teamObjects = teamNames.map((name: string, index: number) => {
        // Use a consistent ID generation based on the team name or index
        const teamId = `team_${tournamentId}_${name.replace(/\s+/g, '_') || index}`;
        return {
          id: teamId,
          name: name || `Equipo ${index + 1}`,
          logoUrl: teamLogos[teamId] || `https://avatar.vercel.sh/${name || `Equipo${index}`}.png`,
        }
      });
      setTeams(teamObjects);
    }
  }, [tournamentId, router]);

  const handleEditNameClick = (team: Team) => {
    setEditingTeamId(team.id);
    setEditingName(team.name);
  };
  
  useEffect(() => {
    if (editingTeamId && inputRef.current) {
        inputRef.current.focus();
    }
  },[editingTeamId]);

  const handleSaveName = (teamId: string) => {
    const teamIndex = teams.findIndex(t => t.id === teamId);
    if (teamIndex === -1) return;

    // Update state
    const updatedTeams = teams.map(t => 
        t.id === teamId ? {...t, name: editingName} : t
    );
    setTeams(updatedTeams);

    // Save to localStorage
    const teamNamesToSave = updatedTeams.map(t => t.name);
    localStorage.setItem(`teams_${tournamentId}`, JSON.stringify(teamNamesToSave));
    
    setEditingTeamId(null);
  };
  
  const handleEditRoster = (team: Team) => {
      setSelectedTeam(team);
      const rosterKey = `roster_${tournamentId}_${team.id}`;
      const savedRoster = JSON.parse(localStorage.getItem(rosterKey) || '[]');
      setRoster(savedRoster);
      setIsEditDialogOpen(true);
  }

  const handlePlayerChange = (index: number, field: keyof Omit<Player, 'id'>, value: string) => {
    const newRoster = [...roster];
    newRoster[index] = {...newRoster[index], [field]: value};
    setRoster(newRoster);
  }
  
  const handleAddPlayer = () => {
    setRoster(prev => [...prev, {
        id: `player_${Date.now()}`,
        dni: '', name: '', lastName: '', age: '', nationality: '', phone: '', address: '', email: ''
    }])
  }

  const handleRemovePlayer = (indexToRemove: number) => {
    setRoster(prev => prev.filter((_, index) => index !== indexToRemove));
  }


  const handleSaveRoster = () => {
      if(selectedTeam) {
        const rosterKey = `roster_${tournamentId}_${selectedTeam.id}`;
        // Filter out players with no DNI, name, or lastname before saving
        const validRoster = roster.filter(p => p.dni.trim() && p.name.trim() && p.lastName.trim());
        localStorage.setItem(rosterKey, JSON.stringify(validRoster));
        
        const allPlayerDetails = JSON.parse(localStorage.getItem("playerDetails") || "{}");
        validRoster.forEach(player => {
             allPlayerDetails[player.dni] = player;
        });
        localStorage.setItem("playerDetails", JSON.stringify(allPlayerDetails));

        setIsEditDialogOpen(false);
        toast({ title: '¡Plantilla Guardada!', description: `La plantilla de ${selectedTeam.name} se guardó correctamente.`});
      }
  }
  
  const handleLogoClick = (teamId: string) => {
    if(isUploading) return;
    setTeamToUpdateLogo(teamId);
    fileInputRef.current?.click();
  };

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && teamToUpdateLogo) {
      setUploadingLogoId(teamToUpdateLogo);
      try {
        const uploadedUrl = await uploadFile(file, `teams/${tournamentId}/logos`);
        
        setTeams(prevTeams => 
            prevTeams.map(t => t.id === teamToUpdateLogo ? {...t, logoUrl: uploadedUrl} : t)
        );

        const teamLogos = JSON.parse(localStorage.getItem(`logos_${tournamentId}`) || '{}');
        teamLogos[teamToUpdateLogo] = uploadedUrl;
        localStorage.setItem(`logos_${tournamentId}`, JSON.stringify(teamLogos));
        toast({ title: '¡Logo Actualizado!', description: 'El nuevo logo del equipo ha sido guardado.'});
      } catch (error) {
        // useUpload hook already shows a toast on error
      } finally {
        setUploadingLogoId(null);
      }
    }
    if(fileInputRef.current) fileInputRef.current.value = '';
    setTeamToUpdateLogo(null);
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/admin/manage-tournaments">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Administrar Torneos
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Gestionar Equipos del Torneo: {tournamentName}
            </CardTitle>
            <CardDescription>
              Edita la información de los equipos y sus plantillas.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader className="items-center text-center">
                  <div className="relative">
                     <Avatar className="w-24 h-24 mb-4 cursor-pointer" onClick={() => handleLogoClick(team.id)}>
                        <AvatarImage src={team.logoUrl} alt={team.name} className="object-cover"/>
                        <AvatarFallback>{team.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    {uploadingLogoId === team.id && (
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center mb-4">
                            <Loader2 className="w-8 h-8 animate-spin text-white"/>
                        </div>
                    )}
                  </div>
                  {editingTeamId === team.id ? (
                     <div className="flex items-center gap-2">
                        <Input
                            ref={inputRef}
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveName(team.id)}
                            onBlur={() => handleSaveName(team.id)}
                            className="text-lg font-bold text-center"
                        />
                        <Button size="icon" onClick={() => handleSaveName(team.id)}><Check className="h-4 w-4" /></Button>
                     </div>
                  ) : (
                    <CardTitle className="cursor-pointer" onClick={() => handleEditNameClick(team)}>
                      {team.name}
                    </CardTitle>
                  )}
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Button onClick={() => handleEditRoster(team)}>
                        <Pen className="mr-2 h-4 w-4" /> EDITAR PLANTILLA
                    </Button>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>

       <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleLogoChange}
       />

       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Editar Plantilla de {selectedTeam?.name}</DialogTitle>
                    <DialogDescription>
                        Gestiona los jugadores y sus datos. El DNI es obligatorio para las estadísticas.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto p-1">
                    <Accordion type="multiple" className="w-full">
                       {roster.map((player, index) => (
                         <AccordionItem value={player.id} key={player.id}>
                            <AccordionTrigger>
                                {player.name || player.lastName ? `${player.name} ${player.lastName}` : `Jugador ${index + 1}`}
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor={`name-${index}`}>Nombre</Label>
                                        <Input id={`name-${index}`} value={player.name} onChange={(e) => handlePlayerChange(index, 'name', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor={`lastName-${index}`}>Apellido</Label>
                                        <Input id={`lastName-${index}`} value={player.lastName} onChange={(e) => handlePlayerChange(index, 'lastName', e.target.value)} />
                                    </div>
                                     <div className="space-y-1">
                                        <Label htmlFor={`dni-${index}`}>DNI</Label>
                                        <div className="relative">
                                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                          <Input id={`dni-${index}`} value={player.dni} onChange={(e) => handlePlayerChange(index, 'dni', e.target.value)} className="pl-9" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor={`age-${index}`}>Edad</Label>
                                        <Input id={`age-${index}`} type="number" value={player.age} onChange={(e) => handlePlayerChange(index, 'age', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor={`nationality-${index}`}>Nacionalidad</Label>
                                        <Input id={`nationality-${index}`} value={player.nationality} onChange={(e) => handlePlayerChange(index, 'nationality', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor={`phone-${index}`}>Teléfono</Label>
                                        <Input id={`phone-${index}`} type="tel" value={player.phone} onChange={(e) => handlePlayerChange(index, 'phone', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor={`address-${index}`}>Dirección</Label>
                                        <Input id={`address-${index}`} value={player.address} onChange={(e) => handlePlayerChange(index, 'address', e.target.value)} />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <Label htmlFor={`email-${index}`}>Correo Electrónico</Label>
                                        <Input id={`email-${index}`} type="email" value={player.email} onChange={(e) => handlePlayerChange(index, 'email', e.target.value)} />
                                    </div>
                                </div>
                                <Button variant="destructive" size="sm" className="mt-2" onClick={() => handleRemovePlayer(index)}>
                                    <Trash2 className="mr-2 h-4 w-4"/> Eliminar Jugador
                                </Button>
                            </AccordionContent>
                         </AccordionItem>
                       ))}
                    </Accordion>
                    <Button variant="outline" className="mt-4 w-full" onClick={handleAddPlayer}>
                        <UserPlus className="mr-2 h-4 w-4"/> Agregar Jugador
                    </Button>
                </div>
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cerrar</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleSaveRoster}>Guardar Plantilla</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
