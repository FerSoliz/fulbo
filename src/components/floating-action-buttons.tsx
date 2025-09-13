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
import { Wand2, Bug, MessageSquare } from 'lucide-react';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export function FloatingActionButtons() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');

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

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-4">
        <TooltipProvider>
            {/* Botón de Mensajes */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                        className="rounded-full h-14 w-14 shadow-lg bg-blue-500 hover:bg-blue-600 text-white" 
                        size="icon"
                        onClick={() => router.push('/messages')}
                    >
                        <MessageSquare className="h-7 w-7" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>Mensajes</p>
                </TooltipContent>
            </Tooltip>

            {/* Botón de Reportar Error */}
            <Tooltip>
                 <TooltipTrigger asChild>
                    <Button 
                        className="rounded-full h-14 w-14 shadow-lg bg-yellow-500 hover:bg-yellow-600 text-white" 
                        size="icon"
                        onClick={() => setIsReportOpen(true)}
                    >
                        <Bug className="h-7 w-7" />
                    </Button>
                </TooltipTrigger>
                 <TooltipContent side="left">
                    <p>Reportar un Error</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>

      {/* Dialog para Reportar Error */}
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
    </>
  );
}
