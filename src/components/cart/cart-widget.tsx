'use client';

import { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useCart } from '@/context/cart-context';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const WHATSAPP_NUMBER = '5491141790072';

interface CartWidgetProps {
  variant?: 'floating' | 'inline';
}

export function CartWidget({ variant = 'floating' }: CartWidgetProps) {
  const [open, setOpen] = useState(false);
  const { cart, itemCount, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();

  const handleCheckout = () => {
    const header = '*🎉 ¡Nuevo Pedido desde SudOne Store! 🎉*';
    const separator = '-----------------------------------';

    const itemsSummary = cart.map(item => {
      const itemTotal = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.price * item.quantity);
      return `*✅ ${item.name}*\n   - _Cantidad:_ ${item.quantity}\n   - _Subtotal:_ ${itemTotal}`;
    }).join('\n\n');

    const totalString = `*💰 TOTAL DEL PEDIDO: ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(cartTotal)}*`;

    const footer = '_Este es un pedido automático. Por favor, aguarda a que un representante te contacte para confirmar stock y coordinar el pago/envío._\n\n_¡Gracias por tu compra! 🙌_';

    const message = [
      header,
      separator,
      '*🛒 RESUMEN DE COMPRA:*',
      '',
      itemsSummary,
      '',
      separator,
      totalString,
      separator,
      '',
      footer
    ].join('\n');

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setOpen(false);
  };

  const isFloating = variant === 'floating';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant={isFloating ? "outline" : "ghost"}
          size="icon"
          className={cn(
            isFloating 
              ? "fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 z-50"
              : "relative h-auto w-auto pb-[12px]"
          )}
        >
          <ShoppingCart className={cn(isFloating ? "h-8 w-8" : "h-6 w-6")} />
          {itemCount > 0 && (
            <span className={cn(
              "absolute block rounded-full bg-destructive text-destructive-foreground font-bold",
              isFloating 
                ? "top-0 right-0 h-6 w-6 text-sm" 
                : "top-[-4px] right-[-4px] h-4 w-4 text-xs"
            )}>
              {itemCount}
            </span>
          )}
          <span className="sr-only">Abrir carrito de compras</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Mi Carrito ({itemCount})</SheetTitle>
        </SheetHeader>
        {cart.length > 0 ? (
          <>
            <ScrollArea className="flex-grow pr-4">
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center space-x-4">
                     <div className="relative h-16 w-16 overflow-hidden rounded-md">
                       <Image src={item.imageUrl || '/placeholder.svg'} alt={item.name} layout="fill" objectFit="cover" />
                    </div>
                    <div className="flex-grow">
                        <p className="font-semibold line-clamp-2">{item.name}</p>
                        <p className="text-muted-foreground text-sm">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.price)}</p>
                        <div className="flex items-center mt-2">
                            <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-4 w-4"/></Button>
                            <span className="w-8 text-center font-bold">{item.quantity}</span>
                            <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-4 w-4"/></Button>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive"/>
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <SheetFooter className="mt-auto pt-6 border-t">
                <div className="w-full space-y-4">
                    <div className="flex justify-between font-bold text-lg">
                        <p>Total:</p>
                        <p>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(cartTotal)}</p>
                    </div>
                    <Button className="w-full" onClick={handleCheckout} disabled={cart.length === 0}>
                        <ShoppingCart className="mr-2 h-4 w-4"/> Finalizar compra por WhatsApp
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <Trash2 className="mr-2 h-4 w-4"/> Vaciar Carrito
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminarán todos los productos de tu carrito.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={clearCart} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Vaciar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground/50" />
            <p className="mt-4 font-semibold">Tu carrito está vacío</p>
            <p className="mt-2 text-sm text-muted-foreground">Añade productos para verlos aquí.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
