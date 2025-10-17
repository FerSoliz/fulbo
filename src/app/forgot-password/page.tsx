'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: 'Campo Vacío',
        description: 'Por favor, ingresa tu correo electrónico.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setIsSent(true);
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el correo de restablecimiento. Verifica que el correo sea correcto.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
            <Link href="/" className="relative w-[200px] h-[60px]" legacyBehavior>
                <Image
                  src="/sudone-titulo.png"
                  alt="SUDONE Logo"
                  fill
                  priority
                  sizes="200px" // <-- ¡SOLUCIÓN AÑADIDA!
                  style={{ objectFit: 'contain' }}
                />
            </Link>
        </div>
        <Card>
          {isSent ? (
             <CardContent className="pt-6 text-center">
                <CardTitle className="text-2xl mb-2">Revisa tu Correo</CardTitle>
                <CardDescription>
                    Se ha enviado un enlace para restablecer la contraseña a <span className="font-bold text-foreground">{email}</span>. Por favor, revisa tu bandeja de entrada y spam.
                </CardDescription>
                <Button asChild className="mt-6 w-full">
                    <Link href="/login">Volver a Inicio de Sesión</Link>
                </Button>
            </CardContent>
          ) : (
            <form onSubmit={handleResetPassword}>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">¿Olvidaste tu Contraseña?</CardTitle>
                <CardDescription>
                  Ingresa tu correo y te enviaremos un enlace para recuperarla.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                   {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                  Enviar Enlace
                </Button>
                <Button variant="link" asChild>
                    <Link href="/login">Volver a Inicio de Sesión</Link>
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
