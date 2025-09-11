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
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/lib/data';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';

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
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setDescription(productToEdit.description);
      setPrice(productToEdit.price.toString());
      setStock(productToEdit.stock.toString());
      setImages(productToEdit.images);
    } else {
      // Reset form when opening to add a new product
      setName('');
      setDescription('');
      setPrice('');
      setStock('');
      setImages([]);
    }
  }, [productToEdit, isOpen]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const newImageUrls: string[] = [];
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImageUrls.push(reader.result as string);
          if(newImageUrls.length === files.length) {
            setImages(prev => [...prev, ...newImageUrls]);
          }
        }
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSave = () => {
    if (!name || !price || !stock || images.length === 0) {
      toast({
        title: 'Error',
        description: 'Por favor, completa todos los campos y sube al menos una imagen.',
        variant: 'destructive',
      });
      return;
    }

    const productData: Product = {
      id: productToEdit ? productToEdit.id : `prod_${Date.now()}`,
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      images,
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
                onClick={() => fileInputRef.current?.click()}
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
                onChange={handleImageUpload}
            />

            {images.length > 0 && (
                <Carousel>
                    <CarouselContent>
                        {images.map((img, index) => (
                        <CarouselItem key={index} className="basis-1/3">
                             <div className="relative group">
                                <Image src={img} alt={`preview ${index}`} width={150} height={150} className="rounded-md object-cover w-full h-32"/>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeImage(index)}
                                >
                                    <X className="h-4 w-4"/>
                                </Button>
                             </div>
                        </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious/>
                    <CarouselNext/>
                </Carousel>
            )}
          
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre del Producto</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="price">Precio</Label>
                <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="stock">Stock Disponible</Label>
                <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
          <Button onClick={handleSave}>Guardar Producto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
