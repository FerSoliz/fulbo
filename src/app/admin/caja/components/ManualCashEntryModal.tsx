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
import { createManualCashEntry } from "@/lib/firebase/db";
import { MatchFinances, FinancialItem } from "@/lib/types";
import { Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ManualCashEntryModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSaveSuccess: () => void;
}

const emptyItem: FinancialItem = { id: "", concept: "", amount: 0 };

export function ManualCashEntryModal({
  isOpen,
  onOpenChange,
  onSaveSuccess,
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
      resetForm();
    }
  }, [isOpen]);

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
      toast({
        title: "Error de autenticación",
        description: "No se pudo verificar tu identidad. Por favor, inicia sesión de nuevo.",
        variant: "destructive",
      });
      return;
    }

    if (!concept.trim()) {
      toast({ title: "Concepto requerido", description: "Por favor, añade un concepto para el asiento.", variant: "destructive" });
      return;
    }

    if (!date) {
        toast({ title: "Fecha requerida", description: "Por favor, selecciona una fecha.", variant: "destructive" });
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
      closedBy: {
        id: user.id,
        name: user.name,
      },
      closedAt: new Date().toISOString(),
    };

    try {
      await createManualCashEntry(concept, date.toISOString(), financesData);
      toast({
        title: "Asiento manual creado",
        description: `El asiento "${concept}" ha sido guardado correctamente.`,
      });
      onSaveSuccess(); // This will trigger a re-fetch in the parent page
      onOpenChange(false); // Close the modal
    } catch (error) {
      console.error("Error al crear asiento manual:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudo crear el asiento manual. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Registrar Asiento de Caja Manual</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Column 1: Concept & Date */}
            <div className="space-y-4">
                <div>
                    <Label htmlFor="concept">Concepto Principal</Label>
                    <Input id="concept" value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Ej: Venta de bebidas en amistoso" />
                </div>
                <div>
                    <Label>Fecha del Movimiento</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className="w-full justify-start text-left font-normal"
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Column 2: Notes */}
            <div className="space-y-4">
                 <div>
                    <Label htmlFor="notes">Notas Adicionales</Label>
                    <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalles opcionales" />
                </div>
            </div>
        </div>
        
        <Separator />
        
        {/* Financial Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Income */}
          <div>
            <h3 className="text-lg font-semibold text-green-600 mb-2">Ingresos (+)</h3>
            <ScrollArea className="h-40 pr-4">
                <div className="space-y-3">
                    {incomeItems.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2">
                        <Input
                        type="text"
                        placeholder="Concepto (ej: 10 aguas)"
                        value={item.concept}
                        onChange={(e) => handleItemChange(item.id, "concept", e.target.value, "income")}
                        />
                        <Input
                        type="number"
                        placeholder="Monto"
                        value={item.amount === 0 ? '' : item.amount}
                        onChange={(e) => handleItemChange(item.id, "amount", e.target.value, "income")}
                        className="w-28"
                        />
                        <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id, "income")}
                        disabled={incomeItems.length <= 1}
                        >
                        <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                    ))}
                </div>
            </ScrollArea>
            <Button variant="outline" size="sm" onClick={() => addItem("income")} className="mt-2">
                <Plus className="h-4 w-4 mr-1" /> Añadir Ingreso
            </Button>
          </div>

          {/* Expenses */}
          <div>
            <h3 className="text-lg font-semibold text-red-600 mb-2">Egresos (-)</h3>
            <ScrollArea className="h-40 pr-4">
                <div className="space-y-3">
                {expenseItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                    <Input
                        type="text"
                        placeholder="Concepto (ej: Pago árbitro)"
                        value={item.concept}
                        onChange={(e) => handleItemChange(item.id, "concept", e.target.value, "expense")}
                    />
                    <Input
                        type="number"
                        placeholder="Monto"
                        value={item.amount === 0 ? '' : item.amount}
                        onChange={(e) => handleItemChange(item.id, "amount", e.target.value, "expense")}
                        className="w-28"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id, "expense")}
                        disabled={expenseItems.length <= 1}
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                    </div>
                ))}
                </div>
            </ScrollArea>
            <Button variant="outline" size="sm" onClick={() => addItem("expense")} className="mt-2">
                <Plus className="h-4 w-4 mr-1" /> Añadir Egreso
            </Button>
          </div>
        </div>

        <Separator />

        {/* Totals */}
        <div className="flex justify-end items-center space-x-6 pr-4 pt-4">
            <p>Ingresos: <span className="font-bold text-green-600">${totalIncome.toFixed(2)}</span></p>
            <p>Egresos: <span className="font-bold text-red-600">${totalExpenses.toFixed(2)}</span></p>
            <p className="text-xl">Balance: <span className={`font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-700'}`}>${balance.toFixed(2)}</span></p>
        </div>


        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isLoading}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar Asiento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
