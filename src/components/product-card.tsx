'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Product } from '@/lib/data';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ProductCardProps {
    product: Product;
    isAdmin: boolean;
    onDelete: (productId: string) => void;
    onEdit: (product: Product) => void;
}

export function ProductCard({ product, isAdmin, onDelete, onEdit }: ProductCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [currentImage, setCurrentImage] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isHovered && product.images.length > 1) {
            intervalRef.current = setInterval(() => {
                setCurrentImage(prev => (prev + 1) % product.images.length);
            }, 1500);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            setCurrentImage(0);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isHovered, product.images.length]);

    const checkoutUrl = `/checkout?id=${product.id}&name=${encodeURIComponent(product.name)}&price=${product.price}&image=${encodeURIComponent(product.images[0])}`;


    return (
        <Card 
            className="flex flex-col overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <CardHeader className="p-0 relative">
                <Dialog>
                    <DialogTrigger asChild>
                        <div className="aspect-square w-full overflow-hidden cursor-pointer">
                            <Image
                                src={product.images[currentImage]}
                                alt={product.name}
                                width={500}
                                height={500}
                                className="w-full h-full object-cover transition-transform duration-500 ease-in-out hover:scale-105"
                            />
                        </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                        {/* FIX: Añadido DialogHeader con título y descripción para accesibilidad */}
                        <DialogHeader className="sr-only">
                            <DialogTitle>Galería de imágenes del producto</DialogTitle>
                            <DialogDescription>Navega por las imágenes del producto.</DialogDescription>
                        </DialogHeader>
                         <Carousel className="w-full">
                            <CarouselContent>
                                {product.images.map((img, index) => (
                                <CarouselItem key={index}>
                                    <Image src={img} alt={`${product.name} - image ${index + 1}`} width={1024} height={1024} className="w-full h-auto object-contain rounded-md" />
                                </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                        </Carousel>
                    </DialogContent>
                </Dialog>
                {isAdmin && (
                    <div className="absolute top-2 right-2">
                         <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" size="icon" className="rounded-full h-8 w-8 bg-black/50 hover:bg-black/70 text-white">
                                        <MoreVertical className="h-4 w-4"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onEdit(product)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar
                                    </DropdownMenuItem>
                                     <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Eliminar
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro de eliminar este producto?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El producto se eliminará permanentemente.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(product.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg leading-tight mb-2">{product.name}</CardTitle>
                <CardDescription className="text-sm line-clamp-2">{product.description}</CardDescription>
            </CardContent>
            <CardFooter className="p-4 flex flex-col items-start">
                 <p className="text-2xl font-bold mb-2">${product.price.toLocaleString('es-AR')}</p>
                 <p className={cn("text-xs font-semibold uppercase", product.stock > 0 ? 'text-green-400' : 'text-red-500')}>
                    {product.stock > 0 ? `Stock: ${product.stock}` : 'Sin Stock'}
                 </p>
                <Button asChild
                    className="w-full mt-4"
                    disabled={product.stock === 0}
                >
                  <Link href={checkoutUrl}>
                    {product.stock > 0 ? 'COMPRAR' : 'SIN STOCK'}
                  </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
