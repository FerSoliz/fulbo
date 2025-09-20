
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setIsSent(true);
      toast({
        title: "Correo Enviado",
        description: "Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.",
      });
    } catch (error: any) {
      console.error(error);
      // Don't reveal if the email exists or not for security reasons
      setIsSent(true);
       toast({
        title: "Correo Enviado",
        description: "Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
            <Link href="/">
                <Image
                src="https://i.postimg.cc/sgTxwJtP/sudone-titulo.png"
                alt="SUDONE Logo"
                width={200}
                height={60}
                priority
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
                    <Link href="/login">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Iniciar Sesión
                    </Link>
                </Button>
             </CardContent>
          ) : (
            <form onSubmit={handleResetPassword}>
                <CardHeader className="text-center">
                <CardTitle className="text-2xl">Restablecer Contraseña</CardTitle>
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
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    />
                </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    {isLoading ? "Enviando..." : "Enviar Correo de Recuperación"}
                </Button>
                <Button variant="link" asChild>
                    <Link href="/login">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Iniciar Sesión
                    </Link>
                </Button>
                </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
