'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Smartphone, Store, CreditCard } from 'lucide-react';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const productName = searchParams.get('name') || 'Producto no encontrado';
  const productPrice = searchParams.get('price') || '0';
  const productImage = searchParams.get('image') || 'https://placehold.co/400x400';
  const [selectedPayment, setSelectedPayment] = useState('local');

  const handleConfirmPurchase = () => {
    if (selectedPayment === 'local') {
      const phoneNumber = '5491141790072'; // Número de teléfono de contacto
      const message = `¡Hola! Quiero coordinar la entrega de mi compra:\n\n*Producto:* ${productName}\n*Precio:* $${parseFloat(productPrice).toLocaleString('es-AR')}\n\n¡Gracias!`;
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Finalizar Compra</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Columna Izquierda: Resumen de Compra */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Resumen de tu Compra</h2>
            <Card>
              <CardHeader>
                <div className="aspect-square w-full overflow-hidden rounded-md">
                  <Image
                    src={productImage}
                    alt={productName}
                    width={400}
                    height={400}
                    className="object-cover w-full h-full"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle>{productName}</CardTitle>
                <p className="text-2xl font-bold mt-2">
                  ${parseFloat(productPrice).toLocaleString('es-AR')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Columna Derecha: Método de Pago */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Elige tu Método de Pago</h2>
            <RadioGroup
              value={selectedPayment}
              onValueChange={setSelectedPayment}
              className="space-y-4"
            >
              <Label
                htmlFor="local"
                className={cn(
                  'flex flex-col p-4 border rounded-lg cursor-pointer transition-all',
                  selectedPayment === 'local'
                    ? 'border-accent ring-2 ring-accent'
                    : 'border-border'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Store className="w-6 h-6" />
                    <span className="font-semibold">Retiro en local</span>
                  </div>
                  <RadioGroupItem value="local" id="local" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Coordina la entrega y paga en efectivo al retirar.
                </p>
              </Label>
              <Label
                htmlFor="card"
                className="flex flex-col p-4 border rounded-lg cursor-not-allowed opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6" />
                    <span className="font-semibold">Tarjeta de Crédito / Mercado Pago</span>
                  </div>
                  <RadioGroupItem value="card" id="card" disabled />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Próximamente disponible.
                p>
              </Label>
            </RadioGroup>

            <div className="mt-8">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full"
                    disabled={selectedPayment !== 'local'}
                  >
                    Confirmar Compra
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¡Último paso!</AlertDialogTitle>
                    <AlertDialogDescription>
                      Estás a punto de ser redirigido a WhatsApp para coordinar la
                      entrega y el pago de tu producto.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmPurchase}>
                      <Smartphone className="mr-2 h-4 w-4" />
                      Pactar entrega por WhatsApp
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="text-center p-8">Cargando...</div>}>
            <CheckoutContent />
        </Suspense>
    )
}
