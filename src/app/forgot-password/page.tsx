
'use client';

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
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function ForgotPasswordPage() {

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
            <CardHeader className="text-center">
            <CardTitle className="text-2xl">Restablecer Contraseña</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4"/>
                <CardDescription>
                    La función de recuperación de contraseña no está disponible en este momento.
                    Por favor, contacta a un administrador para obtener ayuda.
                </CardDescription>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
            <Button variant="link" asChild>
                <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Iniciar Sesión
                </Link>
            </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}

    