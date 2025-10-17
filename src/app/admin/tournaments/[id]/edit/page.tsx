'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
// MODIFICADO: Importaciones correctas de Firebase
import { db } from '@/lib/firebase'; // Tu instancia de la base de datos
import { ref, onValue, update } from 'firebase/database'; // Funciones del SDK de Firebase
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from '@/lib/utils';

interface Tournament {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  status: 'upcoming' | 'ongoing' | 'finished';
  type: string;
  format: string;
  teamCount: number;
}

export default function EditTournamentPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Partial<Tournament>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }

    if (!tournamentId) return;

    // MODIFICADO: Usar 'db' en lugar de 'rtdb'
    const tournamentRef = ref(db, `tournaments/${tournamentId}`);
    const unsubscribe = onValue(tournamentRef, (snapshot) => {
      if (snapshot.exists()) {
        setTournament({ id: snapshot.key, ...snapshot.val() });
      } else {
        toast({ title: "Error", description: "El torneo no fue encontrado.", variant: "destructive" });
        router.push('/admin/manage-tournaments');
      }
      setLoading(false);
    }, (error) => {
        console.error(error);
        toast({ title: "Error de Conexión", description: "No se pudo acceder al torneo.", variant: "destructive" });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [tournamentId, user, userLoading, router, toast]);

  const handleInputChange = (field: keyof Tournament, value: any) => {
    setTournament(prev => ({ ...prev, [field]: value }));
  }

  const handleSave = async () => {
    if (!tournament.name || !tournament.startDate) {
        toast({ title: "Campos incompletos", description: "El nombre y la fecha de inicio son obligatorios.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    try {
        // MODIFICADO: Usar 'db' en lugar de 'rtdb'
        const tournamentRef = ref(db, `tournaments/${tournamentId}`);
        const dataToUpdate = { ...tournament };
        delete dataToUpdate.id; // No guardar el ID dentro del objeto en Firebase

        await update(tournamentRef, dataToUpdate);
        toast({ title: "¡Guardado!", description: "Los detalles del torneo han sido actualizados.", });
        router.push('/admin/manage-tournaments');
    } catch (error) {
        console.error("Error guardando el torneo: ", error);
        toast({ title: "Error", description: "No se pudieron guardar los cambios.", variant: "destructive"});
    } finally {
        setIsSaving(false);
    }
  }

  if (loading || userLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /><span>Cargando datos del torneo...</span></div>;
  }

  return (
      <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
              <Link href="/admin/manage-tournaments" legacyBehavior>
                  <Button variant="outline" className="mb-6">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver a Torneos
                  </Button>
              </Link>
              <Card>
                  <CardHeader>
                      <CardTitle className="text-2xl">Editar Torneo</CardTitle>
                      <CardDescription>Modifica los detalles del torneo "{tournament.name}".</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                      <div className="space-y-2">
                          <Label htmlFor="name">Nombre del Torneo</Label>
                          <Input id="name" value={tournament.name || ''} onChange={e => handleInputChange('name', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <Label htmlFor="type">Tipo</Label>
                              <Select value={tournament.type || ''} onValueChange={value => handleInputChange('type', value)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="Liga">Liga</SelectItem>
                                      <SelectItem value="Copa">Copa</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="format">Formato</Label>
                              <Select value={tournament.format || ''} onValueChange={value => handleInputChange('format', value)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="5v5">Fútbol 5</SelectItem>
                                      <SelectItem value="7v7">Fútbol 7</SelectItem>
                                      <SelectItem value="11v11">Fútbol 11</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                      </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <Label htmlFor="startDate">Fecha de Inicio</Label>
                               <Popover>
                                  <PopoverTrigger asChild>
                                  <Button
                                      variant={"outline"}
                                      className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !tournament.startDate && "text-muted-foreground"
                                      )}
                                  >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {tournament.startDate ? format(new Date(tournament.startDate), "PPP", { locale: es }) : <span>Elige una fecha</span>}
                                  </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                  <Calendar
                                      mode="single"
                                      selected={tournament.startDate ? new Date(tournament.startDate) : undefined}
                                      onSelect={date => handleInputChange('startDate', date?.toISOString())}
                                      initialFocus
                                  />
                                  </PopoverContent>
                              </Popover>
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="status">Estado</Label>
                              <Select value={tournament.status || ''} onValueChange={value => handleInputChange('status', value)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="upcoming">Próximo</SelectItem>
                                      <SelectItem value="ongoing">En Juego</SelectItem>
                                      <SelectItem value="finished">Finalizado</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                      </div>
                      <div className="flex justify-end pt-6 border-t">
                          <Button onClick={handleSave} disabled={isSaving} size="lg">
                              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                              Guardar Cambios
                          </Button>
                      </div>
                  </CardContent>
              </Card>
          </div>
      </div>
  );
}
