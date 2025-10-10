'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Product } from '@/lib/types';
import { useUpload } from '@/hooks/use-upload';
import { useToast } from '@/hooks/use-toast';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, UploadCloud } from 'lucide-react';
import Image from 'next/image';

// --- Esquema de Validación con Zod ---
const productSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  description: z.string().min(10, { message: 'La descripción debe tener al menos 10 caracteres.' }),
  price: z.coerce.number().positive({ message: 'El precio debe ser un número positivo.' }),
  stock: z.coerce.number().int().nonnegative({ message: 'El stock debe ser un número entero no negativo.' }),
  imageUrl: z.string().url({ message: 'Se requiere una URL de imagen válida.' }).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

// --- Props del Diálogo ---
interface ProductEditDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (productData: Omit<Product, 'id'> & { id?: string }) => Promise<boolean>;
  productToEdit: Product | null;
}

// --- Componente del Diálogo ---
export function ProductEditDialog({ isOpen, onOpenChange, onSave, productToEdit }: ProductEditDialogProps) {
  const isEditing = !!productToEdit;

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Producto' : 'Añadir Nuevo Producto'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Realiza cambios en el producto.' : 'Completa los detalles del nuevo producto.'}
          </DialogDescription>
        </DialogHeader>
        <ProductForm 
          onSave={onSave}
          onFinished={() => onOpenChange(false)}
          productToEdit={productToEdit}
        />
      </DialogContent>
    </Dialog>
  );
}

// --- Componente del Formulario ---
interface ProductFormProps {
    onSave: (productData: Omit<Product, 'id'> & { id?: string }) => Promise<boolean>;
    onFinished: () => void;
    productToEdit: Product | null;
}

function ProductForm({ onSave, onFinished, productToEdit }: ProductFormProps) {
    const [isSaving, setIsSaving] = useState(false);
    const { uploadFile, isUploading, progress } = useUpload();
    const { toast } = useToast();

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: productToEdit ? {
            ...productToEdit,
        } : {
            name: '',
            description: '',
            price: 0,
            stock: 0,
            imageUrl: ''
        }
    });

    useEffect(() => {
        if (productToEdit) {
            form.reset(productToEdit);
        } else {
            form.reset({ name: '', description: '', price: 0, stock: 0, imageUrl: '' });
        }
    }, [productToEdit, form]);

    const handleImageUpload = async (file: File) => {
        if (!file) return;
        try {
            const downloadURL = await uploadFile(file, `products/${Date.now()}_${file.name}`);
            form.setValue('imageUrl', downloadURL, { shouldValidate: true });
            toast({ title: 'Éxito', description: 'Imagen subida correctamente.' });
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo subir la imagen.', variant: 'destructive' });
        }
    };

    const onSubmit = async (data: ProductFormValues) => {
        setIsSaving(true);
        const dataToSave = { ...data, ...(productToEdit && { id: productToEdit.id }) };
        const success = await onSave(dataToSave);
        setIsSaving(false);
        if (success) {
            onFinished();
        }
    };

    const imageUrl = form.watch('imageUrl');

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* ... (campos del formulario) */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                            <Input placeholder="Camiseta oficial SudOne" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Describe el producto..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Precio (ARS)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="25000" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Stock</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="100" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Imagen del Producto</FormLabel>
                            <FormControl>
                                <div className="flex items-center gap-4">
                                    {imageUrl && <Image src={imageUrl} alt="Vista previa" width={64} height={64} className="rounded-md object-cover" />}
                                    <label className="flex-1 cursor-pointer border-2 border-dashed rounded-md p-4 text-center hover:bg-muted/50">
                                        <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Haz clic o arrastra para subir</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} disabled={isUploading} />
                                    </label>
                                </div>
                            </FormControl>
                            {isUploading && <div className="text-sm text-muted-foreground">Subiendo... {progress.toFixed(0)}%</div>}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onFinished} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving || isUploading}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
