'use client';

import { useState } from 'react';
import { useFinishedMatches } from '@/hooks/use-finished-matches';
import { EnrichedMatch, MatchFinances } from '@/lib/types';
import { saveMatchFinances } from '@/lib/firebase/db';
import { useToast } from '@/hooks/use-toast';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  Landmark,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Minus,
  Plus,
  PiggyBank,
} from 'lucide-react';

// --- Componente Principal de la Página ---

export default function CajaAdminPage() {
  const { matches, loading, error, refetch } = useFinishedMatches();
  const [selectedMatch, setSelectedMatch] = useState<EnrichedMatch | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = (match: EnrichedMatch) => {
    setSelectedMatch(match);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (wasUpdated: boolean) => {
    setIsDialogOpen(false);
    setSelectedMatch(null);
    if (wasUpdated) {
      refetch(); // Recargamos los datos si hubo una actualización
    }
  }

  if (loading) {
    return <CajaSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Inesperado</AlertTitle>
          <AlertDescription>
            No se pudieron cargar los partidos. Por favor, intenta de nuevo más tarde.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Módulo de Caja</h1>
        <p className="text-muted-foreground">
          Gestiona los ingresos y egresos de los partidos finalizados.
        </p>
      </header>

      {matches.length === 0 ? (
         <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 py-24 text-center">
            <PiggyBank className="h-16 w-16 text-muted-foreground/50" />
            <p className="mt-4 font-semibold">No hay partidos finalizados.</p>
            <p className="mt-2 text-sm text-muted-foreground">Cuando un partido termine, aparecerá aquí para gestionar su caja.</p>
          </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {matches.map(match => (
            <FinanceMatchCard key={match.id} match={match} onOpenDialog={handleOpenDialog} />
          ))}
        </div>
      )}

      {selectedMatch && (
          <MatchFinanceDialog 
            match={selectedMatch} 
            isOpen={isDialogOpen} 
            onClose={handleDialogClose} 
          />
      )}
    </div>
  );
}

// --- Componentes de la Página ---

function FinanceMatchCard({ match, onOpenDialog }: { match: EnrichedMatch, onOpenDialog: (match: EnrichedMatch) => void }) {
  const matchDate = match.details?.date
    ? new Date(match.details.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Fecha no disponible';

  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold leading-tight">{match.tournamentName}</CardTitle>
            {match.financesProcessed && (
                <Badge variant="secondary" className="border-green-500/50 text-green-700 whitespace-nowrap">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Procesado
                </Badge>
            )}
        </div>
        <p className="text-xs text-muted-foreground pt-1">{matchDate}</p>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow flex flex-col justify-center">
        <div className="flex items-center justify-between text-center">
          <div className="flex flex-col items-center gap-2 w-1/3">
            <Image src={match.homeTeamLogo || '/logo-placeholder.png'} alt={match.homeTeamName} width={48} height={48} className="rounded-full aspect-square object-cover" />
            <span className="font-semibold text-sm w-full truncate">{match.homeTeamName}</span>
          </div>
          <div className="text-xl font-bold text-muted-foreground mx-2">vs</div>
          <div className="flex flex-col items-center gap-2 w-1/3">
            <Image src={match.awayTeamLogo || '/logo-placeholder.png'} alt={match.awayTeamName} width={48} height={48} className="rounded-full aspect-square object-cover" />
            <span className="font-semibold text-sm w-full truncate">{match.awayTeamName}</span>
          </div>
        </div>
      </CardContent>
      <div className="p-4 pt-0">
        <Button className="w-full" variant={match.financesProcessed ? 'secondary' : 'default'} onClick={() => onOpenDialog(match)}>
            <Landmark className="mr-2 h-4 w-4" />
            {match.financesProcessed ? 'Ver / Editar Caja' : 'Registrar Caja'}
        </Button>
      </div>
    </Card>
  );
}

function MatchFinanceDialog({ match, isOpen, onClose }: { match: EnrichedMatch, isOpen: boolean, onClose: (updated: boolean) => void }) {
  const [earnings, setEarnings] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveMatchFinances(match.id, { earnings, expenses, notes });
      toast({
        title: "✅ Caja Guardada",
        description: `Las finanzas del partido ${match.homeTeamName} vs ${match.awayTeamName} se guardaron correctamente.`,
      });
      onClose(true);
    } catch (error) {
      console.error(error);
      toast({
        title: "❌ Error al guardar",
        description: "No se pudo guardar la información. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const dialogDate = match.details?.date ? new Date(match.details.date).toLocaleDateString('es-AR') : '';

  return (
     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Registrar Caja del Partido</DialogTitle>
                <DialogDescription>
                    {`${match.homeTeamName} vs ${match.awayTeamName}${dialogDate && ` - ${dialogDate}`}`}
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="earnings" className="text-right">Ingresos</Label>
                    <Input id="earnings" type="number" value={earnings} onChange={(e) => setEarnings(parseFloat(e.target.value) || 0)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expenses" className="text-right">Egresos</Label>
                    <Input id="expenses" type="number" value={expenses} onChange={(e) => setExpenses(parseFloat(e.target.value) || 0)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="notes" className="text-right">Notas</Label>
                    <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" placeholder="Ej: Pago de árbitros, alquiler de cancha, etc."/>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => onClose(false)} disabled={isSaving}>Cancelar</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                    Guardar
                </Button>
            </DialogFooter>
        </DialogContent>
     </Dialog>
  );
}

function CajaSkeleton() {
  return (
    <div className="p-4 md:p-8">
      <header className="mb-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-80 mt-2" />
      </header>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="p-4">
              <Skeleton className="h-4 w-32"/>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center justify-around mb-4">
                <div className="flex flex-col items-center gap-2">
                  <Skeleton className="h-12 w-12 rounded-full"/>
                  <Skeleton className="h-4 w-20"/>
                </div>
                <Skeleton className="h-8 w-20"/>
                <div className="flex flex-col items-center gap-2">
                  <Skeleton className="h-12 w-12 rounded-full"/>
                  <Skeleton className="h-4 w-20"/>
                </div>
              </div>
              <Skeleton className="h-4 w-48 mx-auto mb-4"/>
              <Skeleton className="h-10 w-full"/>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
