'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types';
import { useCart } from '@/context/cart-context';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
    product: Product;
}

const PLACEHOLDER_IMAGE = '/placeholder.svg';

export function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();

    if (!product) return null;

    const imageUrl = product.imageUrl || PLACEHOLDER_IMAGE;
    const productDetailUrl = `/store/${product.id}`;

    return (
        <Card className="flex flex-col overflow-hidden transform transition-all duration-300 hover:shadow-lg group text-sm">
            <Link href={productDetailUrl} className="aspect-square w-full overflow-hidden block">
                <Image
                    src={imageUrl}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                />
            </Link>
            
            <div className="p-3 flex flex-col flex-grow">
                {product.tienda && (
                    <p className="text-xs text-muted-foreground mb-1">{product.tienda}</p>
                )}

                <h3 className="font-semibold leading-tight line-clamp-2 flex-grow min-h-[40px]">
                    <Link href={productDetailUrl} className="hover:underline">
                        {product.name}
                    </Link>
                </h3>
                
                <p className="text-base font-bold my-2">
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(product.price)}
                </p>

                <Button 
                    size="sm"
                    className="w-full mt-auto" 
                    disabled={product.stock === 0}
                    onClick={() => addToCart(product)}
                >
                  {product.stock > 0 ? (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4"/>
                        Añadir al Carrito
                      </>
                  ) : (
                      'Agotado'
                  )}
                </Button>
            </div>
        </Card>
    );
}
