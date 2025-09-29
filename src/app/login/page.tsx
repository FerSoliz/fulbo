'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/user-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(email, password);
    if (success) {
      router.push('/'); 
    } else {
      // Error toast is shown in the context
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
                  className="h-auto"
                  />
              </Link>
          </div>
          <Card>
            <form onSubmit={handleLogin}>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Inicia Sesión</CardTitle>
                <CardDescription>Bienvenido de nuevo a SUDONE</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                  Iniciar Sesión
                </Button>
                <div className="text-sm text-center">
                    <Link href="/forgot-password" className="underline hover:text-primary">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/register">¿No tienes una cuenta? Regístrate</Link>
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    );
}
