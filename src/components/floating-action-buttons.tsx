'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Wand2, Bug, MessageSquare, Plus, X } from 'lucide-react';
import { useUser } from '@/context/user-context';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export function FloatingActionButtons() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [reportText, setReportText] = useState('');

  const isAdmin = user?.role === 'admin' || user?.role === 'editor';
  
  if (!user || user.name === 'VISITANTE') {
    return null; // Don't show for visitors
  }
  
  const handleReportSubmit = () => {
    if(!reportText.trim()) {
        toast({ title: "Error", description: "Por favor, describe el error.", variant: "destructive" });
        return;
    }
    console.log('Error Report Submitted:', reportText);
    toast({ title: "¡Gracias!", description: "Tu reporte de error ha sido enviado." });
    setReportText('');
    setIsReportOpen(false);
  }

  const fabOptions = [
    ...(isAdmin
      ? [
          {
            label: 'Asistente IA',
            icon: Wand2,
            action: () => setIsAiOpen(true),
            bgColor: 'bg-purple-500',
          },
        ]
      : []),
    {
      label: 'Reportar Error',
      icon: Bug,
      action: () => setIsReportOpen(true),
      bgColor: 'bg-yellow-500',
    },
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative">
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex flex-col items-end gap-3 mb-3"
              >
                {fabOptions.map((opt, index) => (
                  <div key={index} className="flex items-center gap-2">
                     <span className="bg-card text-card-foreground text-sm py-1 px-3 rounded-full shadow-lg">
                        {opt.label}
                     </span>
                    <Button
                      className={cn('rounded-full shadow-lg h-12 w-12', opt.bgColor)}
                      size="icon"
                      onClick={() => {
                        opt.action();
                        setIsOpen(false);
                      }}
                    >
                      <opt.icon className="h-6 w-6" />
                    </Button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            className="rounded-full h-16 w-16 shadow-lg bg-accent hover:bg-accent/90"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
          >
            <motion.div animate={{ rotate: isOpen ? 45 : 0 }}>
              <Plus className="h-8 w-8" />
            </motion.div>
          </Button>
        </div>
      </div>

      {/* Report Error Dialog */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reportar un Error</DialogTitle>
            <DialogDescription>
              Describe el problema que encontraste. Agradecemos tu ayuda para mejorar la plataforma.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="report-text" className="sr-only">Descripción del error</Label>
            <Textarea 
                id="report-text"
                placeholder="Ej: El botón de 'Me Gusta' no funciona en las publicaciones..." 
                rows={5}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleReportSubmit}>Enviar Reporte</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* AI Assistant Dialog */}
      <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
            <DialogTitle>Asistente IA de SUDONE</DialogTitle>
            <DialogDescription>
              Usa el poder de la IA para generar contenido, analizar datos y más. (Función en desarrollo).
            </DialogDescription>
          </DialogHeader>
          <div className="h-96 bg-muted/50 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">La interfaz del asistente IA aparecerá aquí.</p>
          </div>
         </DialogContent>
      </Dialog>
    </>
  );
}
