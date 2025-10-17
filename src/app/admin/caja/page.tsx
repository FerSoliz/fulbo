"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, PiggyBank, Plus, Edit } from 'lucide-react';
import { EnrichedMatch, MatchFinances, CashMovement, ManualCashEntry } from '@/lib/types';
import { MatchFinanceDialog } from './components/MatchFinanceDialog';
import { ManualCashEntryModal } from './components/ManualCashEntryModal';
import { useCashMovements } from '@/hooks/useCashMovements'; 
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export default function CajaAdminPage() {
  const { movements, loading, error } = useCashMovements();
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<CashMovement | null>(null);

  const handleOpenDialog = (movement: CashMovement) => {
    setSelectedMovement(movement);
    if (movement.type === 'match') {
      setIsMatchModalOpen(true);
    } else {
      setIsManualEntryModalOpen(true);
    }
  };

  const handleCloseModals = () => {
    setIsMatchModalOpen(false);
    setIsManualEntryModalOpen(false);
    setSelectedMovement(null);
  };

  if (loading) {
    return <CajaSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error al cargar movimientos</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 relative min-h-screen">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Módulo de Caja</h1>
        <p className="text-muted-foreground">
          Gestiona los ingresos y egresos de los partidos y otros movimientos.
        </p>
      </header>

      {movements.length === 0 ? (
         <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 py-24 text-center">
            <PiggyBank className="h-16 w-16 text-muted-foreground/50" />
            <p className="mt-4 font-semibold">No hay movimientos registrados.</p>
            <p className="mt-2 text-sm text-muted-foreground">Los partidos finalizados y asientos manuales aparecerán aquí.</p>
          </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {movements.map(movement => (
            <FinanceMovementCard key={movement.id} movement={movement} onOpenDialog={handleOpenDialog} />
          ))}
        </div>
      )}

      {/* Botón Flotante para NUEVO asiento */}
      <Button
        className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg z-50"
        onClick={() => {
            setSelectedMovement(null); 
            setIsManualEntryModalOpen(true);
        }}
      >
        <Plus className="h-8 w-8" />
        <span className="sr-only">Registrar Asiento Manual</span>
      </Button>

      {/* Modales */}
      {selectedMovement && selectedMovement.type === 'match' && (
          <MatchFinanceDialog 
            match={selectedMovement.data as EnrichedMatch} 
            isOpen={isMatchModalOpen} 
            onClose={handleCloseModals} 
          />
      )}
      
      <ManualCashEntryModal
        isOpen={isManualEntryModalOpen}
        onOpenChange={(isOpen) => !isOpen && handleCloseModals()}
        onSaveSuccess={handleCloseModals}
        existingEntry={selectedMovement?.type === 'manual' ? (selectedMovement.data as ManualCashEntry) : undefined}
      />
    </div>
  );
}

// --- Componentes Reutilizables ---

function FinanceMovementCard({ movement, onOpenDialog }: { movement: CashMovement, onOpenDialog: (movement: CashMovement) => void }) {
  const isManual = movement.type === 'manual';
  
  // FIX: Se implementa la lógica correcta de fecha para CADA CASO.
  let movementDate = 'Fecha no disponible';
  if (movement.date) {
    let dateToParse: string | number | Date;
    
    // Para partidos, la fecha es un string 'YYYY-MM-DD', se corrige la zona horaria.
    if (movement.type === 'match' && typeof movement.date === 'string') {
      dateToParse = new Date(movement.date.replace(/-/g, '/'));
    } else {
      // Para asientos manuales, la fecha es un timestamp numérico u otro formato válido.
      dateToParse = new Date(movement.date);
    }

    // Se formatea la fecha solo si es válida.
    if (!isNaN(dateToParse.getTime())) {
        movementDate = dateToParse.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
    }
  }

  const cardData = movement.data;
  const title = isManual ? cardData.concept : (cardData as EnrichedMatch).tournamentName;
  const finances = isManual ? cardData.finances : (cardData as EnrichedMatch).finances;
  const isProcessed = isManual || (cardData as EnrichedMatch).financesProcessed;
  
  return (
    <Card className={`overflow-hidden flex flex-col transition-all duration-300 ${isProcessed ? 'bg-green-50/20' : ''}`}>
      <CardHeader className="p-4">
        <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold leading-tight">{title}</CardTitle>
            <Badge variant={isManual ? "outline" : "secondary"} className={isManual ? "border-blue-600 bg-blue-100 text-blue-800" : "border-green-600 bg-green-100 text-green-800"}>
                {isManual ? "Asiento Manual" : "Partido Finalizado"}
            </Badge>
        </div>
        <p className="text-xs text-muted-foreground pt-1">{movementDate}</p>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        {!isManual ? (
            <div className="flex items-center justify-between text-center mb-4">
                <div className="flex flex-col items-center gap-2 w-1/3">
                <Image src={(cardData as EnrichedMatch).homeTeamLogo || '/logo-placeholder.png'} alt={(cardData as EnrichedMatch).homeTeamName} width={40} height={40} className="rounded-full aspect-square object-cover" />
                <span className="font-semibold text-sm w-full truncate">{(cardData as EnrichedMatch).homeTeamName}</span>
                </div>
                <div className="text-xl font-bold text-muted-foreground mx-2">vs</div>
                <div className="flex flex-col items-center gap-2 w-1/3">
                <Image src={(cardData as EnrichedMatch).awayTeamLogo || '/logo-placeholder.png'} alt={(cardData as EnrichedMatch).awayTeamName} width={40} height={40} className="rounded-full aspect-square object-cover" />
                <span className="font-semibold text-sm w-full truncate">{(cardData as EnrichedMatch).awayTeamName}</span>
                </div>
            </div>
        ) : (
          <div className="min-h-[96px]"></div>
        )}
        <FinanceSummary finances={finances} />
      </CardContent>
      <div className="p-4 pt-0 mt-auto">
         <Button className="w-full" variant={'secondary'} onClick={() => onOpenDialog(movement)}>
            <Edit className="mr-2 h-4 w-4" /> {isManual ? "Ver / Editar Asiento" : "Ver / Editar Caja"}
        </Button>
      </div>
    </Card>
  );
}

function FinanceSummary({ finances }: { finances: Partial<MatchFinances> | undefined }) {
    const income = finances?.income?.total ?? 0;
    const expenses = finances?.expenses?.total ?? 0;
    const balance = finances?.balance ?? 0;

    return (
        <div className="space-y-2 rounded-lg bg-gray-50 p-3 mt-2">
            <div className="flex justify-between items-center text-sm">
                <p className="text-gray-600">Ingresos:</p>
                <p className="font-semibold text-green-600">${(income || 0).toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center text-sm">
                <p className="text-gray-600">Egresos:</p>
                <p className="font-semibold text-red-600">${(expenses || 0).toFixed(2)}</p>
            </div>
             <div className="flex justify-between items-center text-base font-bold pt-1 border-t">
                <p>Saldo:</p>
                <p className={`${balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>${(balance || 0).toFixed(2)}</p>
            </div>
        </div>
    )
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
