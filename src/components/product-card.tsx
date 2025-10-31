'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types';
import { useCart } from '@/context/cart-context';
import { ShoppingCart, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProductCardProps {
    product: Product;
    isExpanded: boolean;
    onToggleDetails: () => void;
}

const PLACEHOLDER_IMAGE = '/placeholder.svg';

export function ProductCard({ product, isExpanded, onToggleDetails }: ProductCardProps) {
    const { addToCart } = useCart();

    if (!product) return null;

    const imageUrl = product.imageUrl || PLACEHOLDER_IMAGE;

    return (
        <Card className={cn(
            "transition-all duration-500 ease-in-out overflow-hidden group bg-transparent border border-accent-red/50",
            isExpanded ? 'col-span-2' : 'col-span-1'
        )}>
            <div className={`flex ${isExpanded ? 'flex-row' : 'flex-col'}`}>
                {/* --- Primary Card Content --- */}
                <div className={`${isExpanded ? 'w-1/2' : 'w-full'}`}>
                    <div className="flex flex-col h-full">
                        <div className="aspect-[4/3] sm:aspect-square w-full overflow-hidden block">
                            <Image
                                src={imageUrl}
                                alt={product.name}
                                width={300}
                                height={300}
                                className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                            />
                        </div>
                        
                        <div className="p-2 sm:p-3 flex flex-col flex-grow">
                            {product.tienda && (
                                <p className="text-xs text-muted-foreground mb-1">{product.tienda}</p>
                            )}

                            <h3 className="font-semibold leading-tight line-clamp-2">
                                {product.name}
                            </h3>
                            
                            <div className="flex items-center justify-between mt-1">
                                <p className="text-base font-bold">
                                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(product.price)}
                                </p>
                                
                                <Button variant="ghost" size="sm" onClick={onToggleDetails} className="group text-muted-foreground hover:bg-transparent pr-0">
                                    <div className="relative py-1">
                                        <span className="text-xs">Detalles</span>
                                        <span className="absolute bottom-0 left-0 h-[1.5px] w-full scale-x-0 transform bg-accent-red transition-transform duration-300 ease-out group-hover:scale-x-100 origin-left"></span>
                                    </div>
                                    <ChevronRight className={`h-4 w-4 ml-1 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                </Button>
                            </div>

                            <Button 
                                size="sm"
                                className="w-full mt-auto pt-2"
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
                    </div>
                </div>

                {/* --- Expanded Details Panel --- */}
                {isExpanded && (
                    <div className="w-1/2 p-3 bg-secondary/30 border-l border-border-soft">
                        <div className="animate-in fade-in-50 duration-500 h-full flex flex-col">
                            <div className="overflow-y-auto flex-grow space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2 text-primary text-sm">Descripción</h4>
                                    <p className="text-xs leading-relaxed text-muted-foreground pr-2">
                                        {product.description || 'No hay descripción disponible.'}
                                    </p>
                                </div>

                                {product.sizes && product.sizes.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2 text-primary text-sm">Talles</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {product.sizes.map(size => (
                                                <Badge key={size} variant="outline">{size.toUpperCase()}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {product.colors && product.colors.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2 text-primary text-sm">Colores</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {product.colors.map(color => (
                                                <div key={color} className="h-6 w-6 rounded-full border-2" style={{ backgroundColor: color }} title={color.toUpperCase()} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
