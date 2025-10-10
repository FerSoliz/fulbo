'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types'; // Asegúrate que la importación de Product sea desde types
import { cn } from '@/lib/utils';

interface ProductCardProps {
    product: Product;
}

// Un placeholder en caso de que un producto no tenga imagen.
const PLACEHOLDER_IMAGE = '/placeholder.svg';

export function ProductCard({ product }: ProductCardProps) {

    // Comprobación defensiva: si no hay producto, no renderizamos nada.
    if (!product) return null;

    const imageUrl = product.imageUrl || PLACEHOLDER_IMAGE;
    const checkoutUrl = `/checkout?id=${product.id}&name=${encodeURIComponent(product.name)}&price=${product.price}&image=${encodeURIComponent(imageUrl)}`;

    return (
        <Card 
            className="flex flex-col overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
            <CardHeader className="p-0 relative">
                <div className="aspect-square w-full overflow-hidden">
                    <Image
                        src={imageUrl}
                        alt={product.name}
                        width={500}
                        height={500}
                        className="w-full h-full object-cover transition-transform duration-500 ease-in-out hover:scale-105"
                    />
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg leading-tight mb-2 line-clamp-2">{product.name}</CardTitle>
                <CardDescription className="text-sm line-clamp-3">{product.description}</CardDescription>
            </CardContent>
            <CardFooter className="p-4 flex flex-col items-start">
                 <p className="text-2xl font-bold mb-2">
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(product.price)}
                 </p>
                 <p className={cn("text-xs font-semibold uppercase", product.stock > 0 ? 'text-green-500' : 'text-red-500')}>
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
