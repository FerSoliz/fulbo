'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Product } from '@/lib/types';
import { useUpload } from '@/hooks/use-upload';
import { useToast } from '@/hooks/use-toast';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, UploadCloud, X } from 'lucide-react';
import Image from 'next/image';

// --- Colores Predefinidos para la Paleta ---
const PREDEFINED_COLORS = [
  '#000000', // Negro
  '#FFFFFF', // Blanco
  '#FF0000', // Rojo
  '#0000FF', // Azul
  '#008000', // Verde
  '#FFFF00', // Amarillo
  '#FFA500', // Naranja
  '#800080', // Morado
  '#808080', // Gris
  '#A52A2A', // Marrón
];

// --- Esquema de Validación con Zod (Actualizado) ---
const productSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  tienda: z.string().optional(),
  description: z.string().min(10, { message: 'La descripción debe tener al menos 10 caracteres.' }),
  price: z.coerce.number().positive({ message: 'El precio debe ser un número positivo.' }),
  stock: z.coerce.number().int().nonnegative({ message: 'El stock debe ser un número entero no negativo.' }),
  imageUrl: z.string().url({ message: 'Se requiere una URL de imagen válida.' }).optional(),
  sizes: z.string().optional(), // Talles como string separado por comas
  colors: z.array(z.string()).optional(), // Colores como array de hex
});

type ProductFormValues = z.infer<typeof productSchema>;

// --- Props del Diálogo ---
interface ProductEditDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (productData: Omit<Product, 'id'> & { id?: string }) => Promise<boolean>;
  productToEdit: Product | null;
}

// --- Componente del Diálogo (sin cambios) ---
export function ProductEditDialog({ isOpen, onOpenChange, onSave, productToEdit }: ProductEditDialogProps) {
  const isEditing = !!productToEdit;
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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

// --- Componente del Formulario (Actualizado) ---
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
        defaultValues: {
            name: '',
            tienda: '',
            description: '',
            price: 0,
            stock: 0,
            imageUrl: '',
            sizes: '',
            colors: [],
        }
    });

    useEffect(() => {
        if (productToEdit) {
            form.reset({
                ...productToEdit,
                sizes: productToEdit.sizes ? productToEdit.sizes.join(', ') : '',
                colors: productToEdit.colors || [],
            });
        } else {
            form.reset({ name: '', tienda: '', description: '', price: 0, stock: 0, imageUrl: '', sizes: '', colors: [] });
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

        // Procesar los datos antes de guardarlos
        const processedData = {
            ...data,
            sizes: data.sizes ? data.sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
            colors: data.colors || []
        };
        
        const dataToSave = { ...processedData, ...(productToEdit && { id: productToEdit.id }) };

        const success = await onSave(dataToSave);
        setIsSaving(false);
        if (success) {
            onFinished();
        }
    };

    const imageUrl = form.watch('imageUrl');

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                {/* Campos existentes... */}
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="tienda" render={({ field }) => (<FormItem><FormLabel>Tienda</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Precio</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="stock" render={({ field }) => (<FormItem><FormLabel>Stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>

                {/* --- NUEVO: Campo de Talles --- */}
                <FormField
                    control={form.control}
                    name="sizes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Talles Disponibles</FormLabel>
                            <FormControl>
                                <Input placeholder="S, M, L, XL" {...field} />
                            </FormControl>
                            <FormDescription>Escribe los talles separados por comas.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* --- NUEVO: Selector de Colores --- */}
                <FormField
                    control={form.control}
                    name="colors"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Colores Disponibles</FormLabel>
                            <FormDescription>Selecciona colores de la paleta.</FormDescription>
                            <div className="flex flex-wrap gap-2 py-2">
                                {PREDEFINED_COLORS.map(color => (
                                    <Button
                                        type="button"
                                        key={color}
                                        className={`h-8 w-8 rounded-full border-2 ${field.value?.includes(color) ? 'border-ring' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => {
                                            const currentColors = field.value || [];
                                            const newColors = currentColors.includes(color)
                                                ? currentColors.filter(c => c !== color)
                                                : [...currentColors, color];
                                            field.onChange(newColors);
                                        }}
                                    />
                                ))}
                            </div>
                            <FormLabel className="mt-2 text-xs text-muted-foreground">Colores seleccionados:</FormLabel>
                             <div className="flex flex-wrap gap-2 py-2 min-h-[40px] rounded-md border p-2 bg-muted/50">
                                {field.value && field.value.length > 0 ? field.value.map(color => (
                                    <div key={color} className="h-6 px-2 rounded-full border flex items-center text-xs"
                                        style={{ backgroundColor: color, color: color.toLowerCase() === '#ffffff' ? '#000' : '#fff' }}>
                                        {color.toUpperCase()}
                                        <Button type="button" variant="ghost" size="icon" className="h-5 w-5 ml-1 rounded-full" 
                                            onClick={() => field.onChange(field.value?.filter(c => c !== color))}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )) : <span className="text-xs text-muted-foreground">Ninguno</span>}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                {/* Campo de imagen existente... */}
                <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormItem><FormLabel>Imagen</FormLabel><FormControl>{/* ...código de subida... */}</FormControl><FormMessage /></FormItem>)} />

                <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={onFinished} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" disabled={isSaving || isUploading}>{isSaving ? <Loader2 className="animate-spin"/> : 'Guardar'}</Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
