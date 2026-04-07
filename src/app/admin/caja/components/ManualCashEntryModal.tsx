"use client";

import { useState, useMemo, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";
import { saveManualCashEntry } from "@/lib/firebase/db/cashEntries";
import { MatchFinances, FinancialItem, ManualCashEntry } from "@/lib/types";
import { Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ManualCashEntryModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSaveSuccess: () => void;
  existingEntry?: ManualCashEntry;
}

const emptyItem: FinancialItem = { id: "", concept: "", amount: 0 };

export function ManualCashEntryModal({
  isOpen,
  onOpenChange,
  onSaveSuccess,
  existingEntry,
}: ManualCashEntryModalProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [concept, setConcept] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [incomeItems, setIncomeItems] = useState<FinancialItem[]>([
    { ...emptyItem, id: uuidv4() },
  ]);
  const [expenseItems, setExpenseItems] = useState<FinancialItem[]>([
    { ...emptyItem, id: uuidv4() },
  ]);
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setConcept("");
    setDate(new Date());
    setIncomeItems([{ ...emptyItem, id: uuidv4() }]);
    setExpenseItems([{ ...emptyItem, id: uuidv4() }]);
    setNotes("");
  };

  useEffect(() => {
    if (isOpen) {
        if (existingEntry) {
            setConcept(existingEntry.concept);
            setDate(new Date(existingEntry.date));
            const incomes = existingEntry.finances.income?.items || [];
            const expenses = existingEntry.finances.expenses?.items || [];
            setIncomeItems(incomes && incomes.length > 0 ? incomes : [{ ...emptyItem, id: uuidv4() }]);
            setExpenseItems(expenses && expenses.length > 0 ? expenses : [{ ...emptyItem, id: uuidv4() }]);
            setNotes(existingEntry.finances.notes || "");
        } else {
            resetForm();
        }
    }
  }, [isOpen, existingEntry]);

  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    const totalIncome = incomeItems.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
    const totalExpenses = expenseItems.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
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
          ? {
              ...item,
              [field]: field === "amount" ? Number(value) || 0 : value,
            }
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
    if (!concept.trim()) {
      toast({ title: "Concepto requerido", variant: "destructive" });
      return;
    }
    if (!date) {
        toast({ title: "Fecha requerida", variant: "destructive" });
        return;
    }

    setIsLoading(true);

    const financesData: MatchFinances = {
      income: {
        total: totalIncome,
        items: incomeItems.filter(item => item.concept && item.amount > 0),
      },
      expenses: {
        total: totalExpenses,
        items: expenseItems.filter(item => item.concept && item.amount > 0),
      },
      balance,
      notes,
      closedBy: existingEntry?.finances.closedBy || { id: user.id, name: user.name },
      closedAt: existingEntry?.finances.closedAt || new Date().toISOString(),
    };
    
    if (existingEntry) {
        financesData.lastEditedBy = { id: user.id, name: user.name };
        financesData.lastEditedAt = new Date().toISOString();
    }

    try {
        const entryId = existingEntry ? existingEntry.id : undefined;
        await saveManualCashEntry(concept, date, financesData, entryId);
        toast({ title: existingEntry ? "Asiento actualizado" : "Asiento creado" });
        onSaveSuccess();
        onOpenChange(false);
    } catch (error) {
        console.error("Error al guardar asiento:", error);
        toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };
  
  const title = existingEntry ? "Editar Asiento de Caja Manual" : "Registrar Asiento de Caja Manual";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-full md:h-auto md:max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto px-6">
            <div className="space-y-6">
                {/* Concept, Date & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="concept">Concepto Principal</Label>
                        <Input id="concept" value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Ej: Venta de bebidas" />
                    </div>
                    <div className="space-y-2">
                        <Label>Fecha del Movimiento</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="notes">Notas Adicionales</Label>
                        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalles opcionales" />
                    </div>
                </div>
                
                <Separator />
                
                {/* Financial Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Income */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-green-600">Ingresos (+)</h3>
                        <div className="space-y-3">
                            {incomeItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-2">
                                <Input type="text" placeholder="Concepto (ej: 10 aguas)" value={item.concept} onChange={(e) => handleItemChange(item.id, "concept", e.target.value, "income")} />
                                <Input type="number" placeholder="Monto" value={item.amount === 0 ? '' : item.amount} onChange={(e) => handleItemChange(item.id, "amount", e.target.value, "income")} className="w-32" />
                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id, "income")} disabled={incomeItems.length <= 1}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                            ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => addItem("income")} className="mt-2">
                            <Plus className="h-4 w-4 mr-1" /> Añadir Ingreso
                        </Button>
                    </div>

                    {/* Expenses */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-red-600">Egresos (-)</h3>
                        <div className="space-y-3">
                            {expenseItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-2">
                                <Input type="text" placeholder="Concepto (ej: Pago árbitro)" value={item.concept} onChange={(e) => handleItemChange(item.id, "concept", e.target.value, "expense")} />
                                <Input type="number" placeholder="Monto" value={item.amount === 0 ? '' : item.amount} onChange={(e) => handleItemChange(item.id, "amount", e.target.value, "expense")} className="w-32" />
                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id, "expense")} disabled={expenseItems.length <= 1}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                            ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => addItem("expense")} className="mt-2">
                            <Plus className="h-4 w-4 mr-1" /> Añadir Egreso
                        </Button>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Totals Section */}
        <div className="p-6 pt-4 mt-auto border-t bg-background">
             <div className="flex flex-wrap justify-end items-center gap-x-6 gap-y-2">
                <div className="text-sm">Ingresos: <span className="font-bold text-green-600">${totalIncome.toFixed(2)}</span></div>
                <div className="text-sm">Egresos: <span className="font-bold text-red-600">${totalExpenses.toFixed(2)}</span></div>
                <div className="text-base">Balance: <span className={`font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-700'}`}>${balance.toFixed(2)}</span></div>
            </div>
        </div>

        <DialogFooter className="p-6 pt-0">
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isLoading}>Cancelar</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Guardando..." : (existingEntry ? "Actualizar Asiento" : "Guardar Asiento")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
