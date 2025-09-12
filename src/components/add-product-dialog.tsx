'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UploadCloud, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/lib/data';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { useUpload } from '@/hooks/use-upload';
import { Progress } from './ui/progress';

interface AddProductDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (product: Product) => void;
  productToEdit: Product | null;
}

export function AddProductDialog({
  isOpen,
  onOpenChange,
  onSave,
  productToEdit,
}: AddProductDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadMultipleFiles, isUploading, progress } = useUpload();

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setDescription(productToEdit.description);
      setPrice(productToEdit.price.toString());
      setStock(productToEdit.stock.toString());
      setImageUrls(productToEdit.images);
      setFilesToUpload([]);
    } else {
      // Reset form when opening to add a new product
      setName('');
      setDescription('');
      setPrice('');
      setStock('');
      setImageUrls([]);
      setFilesToUpload([]);
    }
  }, [productToEdit, isOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFilesToUpload(prev => [...prev, ...newFiles]);

      const newImagePreviews = newFiles.map(file => URL.createObjectURL(file));
      setImageUrls(prev => [...prev, ...newImagePreviews]);
    }
  };

  const removeImage = (indexToRemove: number, url: string) => {
    // Revoke blob URL to prevent memory leaks if it's a preview
    if(url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
    
    // This is a bit tricky. We need to remove from both files and urls.
    // Let's find the corresponding file for the blob url.
    const newImageUrls = imageUrls.filter((_, i) => i !== indexToRemove);
    
    // We can't directly map a blob url to a file, so let's count how many non-blob urls we have
    const nonBlobUrlsBefore = imageUrls.slice(0, indexToRemove).filter(u => !u.startsWith('blob:')).length;
    const isBlobUrl = url.startsWith('blob:');

    if(isBlobUrl) {
      const fileIndexToRemove = indexToRemove - nonBlobUrlsBefore;
      setFilesToUpload(prev => prev.filter((_, i) => i !== fileIndexToRemove));
    }
    
    setImageUrls(newImageUrls);
  };

  const handleSave = async () => {
    if (!name || !price || !stock) {
      toast({
        title: 'Error',
        description: 'Por favor, completa todos los campos.',
        variant: 'destructive',
      });
      return;
    }
     if (filesToUpload.length === 0 && imageUrls.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes subir al menos una imagen para el producto.',
        variant: 'destructive',
      });
      return;
    }


    let finalImageUrls = imageUrls.filter(url => !url.startsWith('blob:'));

    if(filesToUpload.length > 0) {
        const uploadedUrls = await uploadMultipleFiles(filesToUpload, 'products');
        if (uploadedUrls.length === 0 && finalImageUrls.length === 0) {
            toast({ title: 'Error de subida', description: 'No se pudo subir ninguna imagen. Inténtalo de nuevo.', variant: 'destructive'});
            return;
        }
        finalImageUrls = [...finalImageUrls, ...uploadedUrls];
    }

    const productData: Product = {
      id: productToEdit ? productToEdit.id : `prod_${Date.now()}`,
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      images: finalImageUrls,
      isInitial: productToEdit ? productToEdit.isInitial : false,
    };

    onSave(productData);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{productToEdit ? 'Editar Producto' : 'Agregar Nuevo Producto'}</DialogTitle>
          <DialogDescription>
            Completa los detalles del producto.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <div 
                className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50"
                onClick={() => !isUploading && fileInputRef.current?.click()}
            >
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                    Arrastra y suelta imágenes aquí, o haz clic para seleccionar archivos.
                </p>
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                multiple 
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
            />

            {imageUrls.length > 0 && (
                <Carousel>
                    <CarouselContent>
                        {imageUrls.map((img, index) => (
                        <CarouselItem key={index} className="basis-1/3">
                             <div className="relative group">
                                <Image src={img} alt={`preview ${index}`} width={150} height={150} className="rounded-md object-cover w-full h-32"/>
                                {!isUploading && <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeImage(index, img)}
                                >
                                    <X className="h-4 w-4"/>
                                </Button>}
                             </div>
                        </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious/>
                    <CarouselNext/>
                </Carousel>
            )}

            {isUploading && <Progress value={progress} />}
          
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre del Producto</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isUploading}/>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isUploading}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="price">Precio</Label>
                <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} disabled={isUploading}/>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="stock">Stock Disponible</Label>
                <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} disabled={isUploading}/>
            </div>
          </div>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isUploading}>Cancelar</Button>
            </DialogClose>
          <Button onClick={handleSave} disabled={isUploading}>
              {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : 'Guardar Producto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
