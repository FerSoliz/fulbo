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
import { Eye, EyeOff, Loader2, X } from 'lucide-react';
import type { User } from '@/lib/data';
import { useUser } from '@/context/user-context';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useUser();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Error de Contraseña",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 6) {
        toast({
            title: "Contraseña Débil",
            description: "La contraseña debe tener al menos 6 caracteres.",
            variant: "destructive",
        });
        return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const userExists = storedUsers.some((u: User) => u.email === email);

    if (userExists) {
        toast({
            title: "Error de Registro",
            description: "Este correo electrónico ya está en uso.",
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }

    const newUser: User = {
        id: `user_${Date.now()}`,
        name: username,
        email: email,
        password: password, // In a real app, this should be hashed
        role: 'user',
        avatar: `https://avatar.vercel.sh/${username.replace(/\s+/g, '')}.png`,
        isVerified: false,
        isBlocked: false,
        location: 'Desconocida',
        sudpoints: 0,
        baseSudpoints: 0,
        league: 'Bronce',
        division: 4,
        stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
    };

    const updatedUsers = [...storedUsers, newUser];
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    // Auto-login the user after registration by calling the context login function
    const loginSuccess = login(email, password);

    if (loginSuccess) {
        toast({
            title: "¡Cuenta Creada!",
            description: "Tu cuenta ha sido creada exitosamente. Serás redirigido.",
        });
        router.push('/');
    } else {
        // This case should ideally not happen if registration is successful
        toast({
            title: "Error de inicio de sesión post-registro",
            description: "No se pudo iniciar sesión automáticamente. Por favor, intenta iniciar sesión manualmente.",
            variant: "destructive",
        });
        router.push('/login');
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
        <Card className="relative">
          <Link href="/" passHref>
            <Button variant="ghost" size="icon" className="absolute top-4 right-4">
              <X className="h-5 w-5" />
            </Button>
          </Link>
          <form onSubmit={handleRegister}>
            <CardHeader className="text-center pt-12">
              <CardTitle className="text-2xl">Crear una Cuenta</CardTitle>
              <CardDescription>
                Completa tus datos para registrarte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nombre de Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Tu nombre de usuario"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
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
                <Label htmlFor="password">Contraseña (mín. 6 caracteres)</Label>
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
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                 <div className="relative">
                    <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                    />
                     <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
               <p className="text-center text-sm text-muted-foreground">
                    ¿Ya tienes una cuenta?{" "}
                    <Link href="/login" className="font-semibold text-accent hover:underline">
                        Inicia sesión
                    </Link>
                </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
