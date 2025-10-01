'use client';

import { useState, useEffect, useRef } from 'react';
import { rtdb, storage, ref as dbRef, set, push } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

// --- TIPOS DE DATOS ---
interface Team {
  id: string;
  name: string;
  logoUrl?: string;
}

interface UpsertTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamToEdit?: Team | null; // Lo usaremos más adelante para editar
  onSuccess: () => void;
}

const MAX_FILE_SIZE_MB = 2;

export function UpsertTeamDialog({ open, onOpenChange, teamToEdit, onSuccess }: UpsertTeamDialogProps) {
  const [name, setName] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isEditMode = !!teamToEdit;

  useEffect(() => {
    // Si pasamos un equipo para editar, llenamos el formulario con sus datos.
    if (teamToEdit) {
      setName(teamToEdit.name);
      setLogoPreview(teamToEdit.logoUrl || null);
    } else {
      // Si es para crear, reseteamos el formulario.
      setName('');
      setLogoPreview(null);
    }
    // Reseteamos el estado de errores y archivos al abrir/cambiar de modo.
    setLogoFile(null);
    setError(null);
  }, [teamToEdit, open]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`El logo no puede pesar más de ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
      setError(null);
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('El nombre del equipo es obligatorio.');
      return;
    }
    setError(null);
    setIsSaving(true);

    try {
      let logoUrl = teamToEdit?.logoUrl || '';
      const teamId = teamToEdit?.id || push(dbRef(rtdb, 'teams')).key;

      if (!teamId) throw new Error("No se pudo generar un ID para el equipo.");

      // Si se seleccionó un nuevo archivo de logo, lo subimos.
      if (logoFile) {
        const logoStorageRef = storageRef(storage, `team-logos/${teamId}`);
        const uploadResult = await uploadBytes(logoStorageRef, logoFile);
        logoUrl = await getDownloadURL(uploadResult.ref);
      }

      // Guardamos/actualizamos los datos en la Realtime Database.
      await set(dbRef(rtdb, `teams/${teamId}`), {
        name: name.trim(),
        logoUrl: logoUrl,
      });

      toast({
        title: `¡Equipo ${isEditMode ? 'actualizado' : 'creado'}!`,
        description: `El equipo "${name.trim()}" se guardó correctamente.`,
        className: 'bg-green-500 text-white',
      });
      
      onSuccess(); // Llamamos al callback de éxito.

    } catch (err) {
      console.error(err);
      toast({
        title: 'Error al guardar',
        description: 'No se pudo guardar el equipo. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Equipo' : 'Crear Nuevo Equipo'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modifica los detalles del equipo.' : 'Completa los datos para registrar un nuevo equipo en la plataforma.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nombre</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="Ej: Real SudOne" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Logo</Label>
            <div className="col-span-3 flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={logoPreview} />
                <AvatarFallback><ImageIcon className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
              </Avatar>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Cambiar Logo
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
            </div>
          </div>
          {error && (
            <div className="col-span-4 flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost"><X className="mr-2 h-4 w-4" />Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
