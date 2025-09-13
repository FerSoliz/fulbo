
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
import { useUser } from '@/context/user-context';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(email, password);
    if (success) {
      toast({
        title: "¡Bienvenido de vuelta!",
        description: "Has iniciado sesión correctamente.",
      });
      router.push('/');
    } else {
      toast({
        title: "Error de inicio de sesión",
        description: "El correo electrónico o la contraseña son incorrectos.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
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
          <form onSubmit={handleLogin}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
              <CardDescription>
                Ingresa a tu cuenta para continuar
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
              <div className="space-y-2">
                 <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                     <Link
                        href="/forgot-password"
                        className="text-sm text-muted-foreground hover:underline"
                    >
                        ¿Olvidaste tu contraseña?
                    </Link>
                 </div>
                <div className="relative">
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Ingresando..." : "Iniciar Sesión"}
              </Button>
               <p className="text-center text-sm text-muted-foreground">
                    ¿No tienes una cuenta?{" "}
                    <Link href="/register" className="font-semibold text-accent hover:underline">
                        Regístrate
                    </Link>
                </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

    