'use client';

import { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import { saveMatchFinances } from '@/lib/firebase/db';
import { EnrichedMatch, MatchFinances, FinancialItem } from '@/lib/types';

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, Trash2 } from 'lucide-react';

interface MatchFinanceDialogProps {
  match: EnrichedMatch;
  isOpen: boolean;
  onClose: (updated: boolean) => void;
}

const emptyItem: FinancialItem = { id: "", concept: "", amount: 0 };

export function MatchFinanceDialog({ match, isOpen, onClose }: MatchFinanceDialogProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [incomeItems, setIncomeItems] = useState<FinancialItem[]>([]);
  const [expenseItems, setExpenseItems] = useState<FinancialItem[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen && match) {
      setIncomeItems(match.finances?.income.items || [{ ...emptyItem, id: uuidv4() }]);
      setExpenseItems(match.finances?.expenses.items || [{ ...emptyItem, id: uuidv4() }]);
      setNotes(match.finances?.notes || "");
    } else {
      // Reset when closing
      setIncomeItems([{ ...emptyItem, id: uuidv4() }]);
      setExpenseItems([{ ...emptyItem, id: uuidv4() }]);
      setNotes("");
    }
  }, [isOpen, match]);

  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    const totalIncome = incomeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalExpenses = expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const balance = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, balance };
  }, [incomeItems, expenseItems]);

  const handleItemChange = (
    id: string,
    field: "concept" | "amount",
    value: string,
    type: "income" | "expense"
  ) => {
    const setItems = type === "income" ? setIncomeItems : setExpenseItems;
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, [field]: field === "amount" ? Number(value) || 0 : value }
          : item
      )
    );
  };

  const addItem = (type: "income" | "expense") => {
    const setItems = type === "income" ? setIncomeItems : setExpenseItems;
    setItems((prev) => [...prev, { id: uuidv4(), concept: "", amount: 0 }]);
  };

  const removeItem = (id: string, type: "income" | "expense") => {
    const setItems = type === "income" ? setIncomeItems : setExpenseItems;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    if (!user || !user.id) {
      toast({ title: "Error de autenticación", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const finalFinances: MatchFinances = {
      income: {
        total: totalIncome,
        items: incomeItems.filter(item => item.concept.trim() && item.amount > 0),
      },
      expenses: {
        total: totalExpenses,
        items: expenseItems.filter(item => item.concept.trim() && item.amount > 0),
      },
      balance,
      notes,
      closedBy: { id: user.id, name: user.name },
      closedAt: new Date().toISOString(),
    };

    try {
      await saveMatchFinances(match.id, finalFinances);
      toast({ title: "Caja guardada", description: `Las finanzas para ${match.tournamentName} se han actualizado.` });
      onClose(true); // Notify parent to refetch
    } catch (error) {
      console.error("Error al guardar las finanzas del partido:", error);
      toast({ title: "Error al guardar", description: "No se pudieron actualizar las finanzas. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Gestionar Caja del Partido</DialogTitle>
          <DialogDescription>
            {`${match.homeTeamName} vs ${match.awayTeamName}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Ingresos */}
          <div>
            <h3 className="text-lg font-semibold text-green-600 mb-2">Ingresos (+)</h3>
            <ScrollArea className="h-48 pr-4">
                <div className="space-y-3">
                    {incomeItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                        <Input placeholder="Concepto" value={item.concept} onChange={(e) => handleItemChange(item.id, "concept", e.target.value, "income")} />
                        <Input type="number" placeholder="Monto" value={item.amount === 0 ? '' : item.amount} onChange={(e) => handleItemChange(item.id, "amount", e.target.value, "income")} className="w-28" />
                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.id, "income")} disabled={incomeItems.length <= 1}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                    ))}
                </div>
            </ScrollArea>
            <Button variant="outline" size="sm" onClick={() => addItem("income")} className="mt-2"><Plus className="h-4 w-4 mr-1" /> Añadir Ingreso</Button>
          </div>

          {/* Egresos */}
          <div>
            <h3 className="text-lg font-semibold text-red-600 mb-2">Egresos (-)</h3>
            <ScrollArea className="h-48 pr-4">
                <div className="space-y-3">
                {expenseItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                        <Input placeholder="Concepto" value={item.concept} onChange={(e) => handleItemChange(item.id, "concept", e.target.value, "expense")} />
                        <Input type="number" placeholder="Monto" value={item.amount === 0 ? '' : item.amount} onChange={(e) => handleItemChange(item.id, "amount", e.target.value, "expense")} className="w-28" />
                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.id, "expense")} disabled={expenseItems.length <= 1}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                ))}
                </div>
            </ScrollArea>
            <Button variant="outline" size="sm" onClick={() => addItem("expense")} className="mt-2"><Plus className="h-4 w-4 mr-1" /> Añadir Egreso</Button>
          </div>
        </div>

        <Separator />
        <div className="space-y-2 pt-4">
            <div>
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalles sobre la caja del partido" />
            </div>
             <div className="flex justify-end items-center space-x-6 pr-4 pt-4">
                <p>Ingresos: <span className="font-bold text-green-600">${totalIncome.toFixed(2)}</span></p>
                <p>Egresos: <span className="font-bold text-red-600">${totalExpenses.toFixed(2)}</span></p>
                <p className="text-xl">Balance: <span className={`font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-700'}`}>${balance.toFixed(2)}</span></p>
            </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isLoading}>Cancelar</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
