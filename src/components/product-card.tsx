'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/cart-context'; // Importamos el hook del carrito
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
    product: Product;
}

const PLACEHOLDER_IMAGE = '/placeholder.svg';

export function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart(); // Obtenemos la función para añadir al carrito

    if (!product) return null;

    const imageUrl = product.imageUrl || PLACEHOLDER_IMAGE;
    // El enlace ahora puede apuntar a una página de detalle del producto en el futuro
    // Por ahora, lo dejamos apuntando a sí mismo o a la tienda.
    const productDetailUrl = `/store/${product.id}`;

    return (
        <Card className="flex flex-col overflow-hidden transform transition-all duration-300 hover:shadow-lg group">
            <Link href={productDetailUrl} legacyBehavior>
                <a className="aspect-square w-full overflow-hidden block">
                    <Image
                        src={imageUrl}
                        alt={product.name}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                    />
                </a>
            </Link>
            <div className="p-3 flex flex-col flex-grow">
                <CardTitle className="text-sm font-semibold leading-tight mb-1 line-clamp-2 h-10">{product.name}</CardTitle>
                
                <div className="flex-grow" />
                
                <div className="flex justify-between items-center mt-2">
                    <p className="text-lg font-bold">
                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(product.price)}
                    </p>
                    <p className={cn("text-xs font-semibold", product.stock > 0 ? 'text-green-500' : 'text-red-500')}>
                         {product.stock > 0 ? 'Disponible' : 'Agotado'}
                    </p>
                </div>
                
                <Button 
                    size="sm"
                    className="w-full mt-3"
                    disabled={product.stock === 0}
                    onClick={() => addToCart(product)} // ¡Aquí está la magia!
                >
                  <ShoppingCart className="mr-2 h-4 w-4"/>
                  Añadir al Carrito
                </Button>
            </div>
        </Card>
    );
}
