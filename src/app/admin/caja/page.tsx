'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFinishedMatches } from '@/hooks/use-finished-matches';
import { EnrichedMatch, MatchFinances, FinanceItem } from '@/lib/types';
import { saveMatchFinances } from '@/lib/firebase/db';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

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
  Edit,
  X,
  Trash2,
  ArrowDown, 
  ArrowUp
} from 'lucide-react';
import { useUser } from '@/context/user-context';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"


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
      refetch();
    }
  }

  if (loading) return <CajaSkeleton />;

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
          Gestiona los ingresos y egresos de los partidos finalizados por conceptos.
        </p>
      </header>

      {matches.length === 0 ? (
         <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 py-24 text-center">
            <PiggyBank className="h-16 w-16 text-muted-foreground/50" />
            <p className="mt-4 font-semibold">No hay partidos finalizados.</p>
            <p className="mt-2 text-sm text-muted-foreground">Cuando un partido termine, aparecerá aquí para gestionar su caja.</p>
          </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

// --- Componentes Reutilizables ---

const formatCurrency = (value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

function FinanceMatchCard({ match, onOpenDialog }: { match: EnrichedMatch, onOpenDialog: (match: EnrichedMatch) => void }) {
  const matchDate = match.details?.date ? new Date(match.details.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Fecha no disponible';

  return (
    <Card className={`overflow-hidden flex flex-col transition-all duration-300 ${match.financesProcessed ? 'bg-green-50/20' : ''}`}>
      <CardHeader className="p-4">
        <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold leading-tight">{match.tournamentName}</CardTitle>
            {match.financesProcessed && (
                <Badge variant="secondary" className="border-green-600 bg-green-100 text-green-800 whitespace-nowrap">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Caja Cerrada
                </Badge>
            )}
        </div>
        <p className="text-xs text-muted-foreground pt-1">{matchDate}</p>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <div className="flex items-center justify-between text-center mb-4">
          <div className="flex flex-col items-center gap-2 w-1/3">
            <Image src={match.homeTeamLogo || '/logo-placeholder.png'} alt={match.homeTeamName} width={40} height={40} className="rounded-full aspect-square object-cover" />
            <span className="font-semibold text-sm w-full truncate">{match.homeTeamName}</span>
          </div>
          <div className="text-xl font-bold text-muted-foreground mx-2">vs</div>
          <div className="flex flex-col items-center gap-2 w-1/3">
            <Image src={match.awayTeamLogo || '/logo-placeholder.png'} alt={match.awayTeamName} width={40} height={40} className="rounded-full aspect-square object-cover" />
            <span className="font-semibold text-sm w-full truncate">{match.awayTeamName}</span>
          </div>
        </div>
        {match.financesProcessed && <FinanceSummary finances={match.finances} />}
      </CardContent>
      <div className="p-4 pt-0 mt-auto">
        <Button className="w-full" variant={match.financesProcessed ? 'secondary' : 'default'} onClick={() => onOpenDialog(match)}>
            {match.financesProcessed ? <><Edit className="mr-2 h-4 w-4" /> Ver / Editar Caja</> : <><Landmark className="mr-2 h-4 w-4" /> Registrar Caja</>}
        </Button>
      </div>
    </Card>
  );
}

function FinanceSummary({ finances }: { finances: MatchFinances | undefined }) {
    if (!finances) return null;
    return (
        <div className="space-y-2 rounded-lg bg-gray-50 p-3 mt-2">
            <div className="flex justify-between items-center text-sm">
                <p className="text-gray-600 flex items-center"><Plus className="mr-2 h-4 w-4 text-green-500"/> Ingresos:</p>
                <p className="font-semibold text-green-600">{formatCurrency(finances.income)}</p>
            </div>
            <div className="flex justify-between items-center text-sm">
                <p className="text-gray-600 flex items-center"><Minus className="mr-2 h-4 w-4 text-red-500"/> Egresos:</p>
                <p className="font-semibold text-red-600">{formatCurrency(finances.expenses)}</p>
            </div>
             <div className="flex justify-between items-center text-base font-bold pt-1 border-t">
                <p>Saldo:</p>
                <p>{formatCurrency(finances.balance)}</p>
            </div>
        </div>
    )
}

// --- Componente del Modal de Finanzas (Reconstruido) ---

function MatchFinanceDialog({ match, isOpen, onClose }: { match: EnrichedMatch, isOpen: boolean, onClose: (updated: boolean) => void }) {
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [notes, setNotes] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemType, setNewItemType] = useState<'income' | 'expense'>('income');
  
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
        setItems(match.finances?.items || []);
        setNotes(match.finances?.notes || '');
        // Reset new item form
        setNewItemDesc('');
        setNewItemAmount('');
        setNewItemType('income');
    }
  }, [isOpen, match.finances]);

  const { income, expenses, balance } = useMemo(() => {
    const income = items.filter(i => i.type === 'income').reduce((sum, i) => sum + i.amount, 0);
    const expenses = items.filter(i => i.type === 'expense').reduce((sum, i) => sum + i.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [items]);

  const handleAddItem = () => {
    const amount = parseFloat(newItemAmount);
    if (!newItemDesc.trim() || !amount || amount <= 0) {
        toast({ title: "Datos incompletos", description: "La descripción y un monto válido son requeridos.", variant: "destructive" });
        return;
    }
    const newItem: FinanceItem = { id: uuidv4(), description: newItemDesc.trim(), amount, type: newItemType };
    setItems(prev => [...prev, newItem]);
    // Reset form
    setNewItemDesc('');
    setNewItemAmount('');
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    if (!user) {
        toast({ title: "Error de Autenticación", variant: "destructive"});
        return;
    }
    setIsSaving(true);
    try {
      const financeData: MatchFinances = { income, expenses, balance, items, notes, closedBy: user.id, closedAt: new Date().toISOString() };
      await saveMatchFinances(match.id, financeData);
      toast({ title: "Caja Guardada", description: "Las finanzas del partido se actualizaron correctamente.", className: 'bg-green-100 text-green-800' });
      onClose(true);
    } catch (error) { 
      console.error("Error saving finances:", error);
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
        <DialogContent className="max-w-lg">
            <DialogHeader>
                <DialogTitle>{match.financesProcessed ? "Editar" : "Registrar"} Caja del Partido</DialogTitle>
                <DialogDescription>{`${match.homeTeamName} vs ${match.awayTeamName}`}</DialogDescription>
            </DialogHeader>

            {/* Formulario para añadir items */}
            <div className="grid grid-cols-12 gap-2 p-4 border rounded-lg">
                <div className="col-span-12 md:col-span-6">
                    <Label htmlFor="desc">Concepto</Label>
                    <Input id="desc" value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} placeholder="Ej: Pago de árbitro"/>
                </div>
                <div className="col-span-5 md:col-span-3">
                    <Label htmlFor="amount">Monto</Label>
                    <Input id="amount" type="number" value={newItemAmount} onChange={e => setNewItemAmount(e.target.value)} placeholder="1500"/>
                </div>
                <div className="col-span-7 md:col-span-3 flex items-end">
                    <ToggleGroup type="single" value={newItemType} onValueChange={(value: 'income' | 'expense') => value && setNewItemType(value)} className="w-full">
                        <ToggleGroupItem value="income" className="w-1/2 border data-[state=off]:bg-gray-200 data-[state=on]:bg-green-500 data-[state=on]:text-white"><ArrowUp className="h-4 w-4"/></ToggleGroupItem>
                        <ToggleGroupItem value="expense" className="w-1/2 border data-[state=off]:bg-gray-200 data-[state=on]:bg-red-500 data-[state=on]:text-white"><ArrowDown className="h-4 w-4"/></ToggleGroupItem>
                    </ToggleGroup>
                </div>
                 <div className="col-span-12 flex justify-end">
                     <Button onClick={handleAddItem} size="sm"> <Plus className="mr-2 h-4 w-4"/> Añadir Concepto</Button>
                </div>
            </div>

            {/* Lista de items */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto p-1">
                {items.length === 0 ? (
                    <p className="text-sm text-center text-gray-500 py-4">Aún no hay conceptos. Añade uno para empezar.</p>
                ) : items.map(item => (
                    <div key={item.id} className={`flex items-center justify-between py-1 px-2 rounded-md ${item.type === 'income' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                        <span className="flex-grow truncate font-medium text-sm">{item.description}</span>
                        <div className="flex items-center gap-2 ml-2">
                            <span className="font-semibold text-base">{formatCurrency(item.amount)}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => handleRemoveItem(item.id)}>
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Resumen y Notas */}
            <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center"><span className="text-gray-600">Total Ingresos</span> <span className="font-bold text-green-600">{formatCurrency(income)}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600">Total Egresos</span> <span className="font-bold text-red-600">{formatCurrency(expenses)}</span></div>
                <div className="flex justify-between items-center text-lg border-t pt-2"><span className="font-bold">Saldo Final</span> <span className="font-bold text-xl">{formatCurrency(balance)}</span></div>
                <div>
                    <Label htmlFor="notes">Notas Adicionales (Opcional)</Label>
                    <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Cualquier aclaración sobre los movimientos..."/>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={() => onClose(false)} disabled={isSaving}>Cancelar</Button>
                <Button onClick={handleSave} disabled={isSaving || items.length === 0}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className='h-4 w-4 mr-1' />} 
                    {match.financesProcessed ? 'Guardar Cambios' : 'Guardar y Cerrar Caja'}
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="p-4">
              <Skeleton className="h-4 w-32"/>
               <Skeleton className="h-3 w-24 mt-1"/>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center justify-between text-center mb-4">
                <div className="flex flex-col items-center gap-2 w-1/3">
                  <Skeleton className="h-10 w-10 rounded-full"/>
                  <Skeleton className="h-4 w-20"/>
                </div>
                <p className='text-muted-foreground'>vs</p>
                <div className="flex flex-col items-center gap-2 w-1/3">
                  <Skeleton className="h-10 w-10 rounded-full"/>
                  <Skeleton className="h-4 w-20"/>
                </div>
              </div>
              <Skeleton className="h-10 w-full mt-auto"/>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
