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

const backgrounds = [
    { name: 'AFA', url: 'https://i.postimg.cc/1RfWNTCC/lusail.png', crest: 'https://i.postimg.cc/YqTT9ktz/escudito-afa.png' },
    { name: 'River Plate', url: 'https://i.postimg.cc/BnnbJSjY/ELMONUMENTALRIVERPLATE2.png', crest: 'https://i.postimg.cc/3wts3GNd/escudito-river.png' },
    { name: 'Boca Juniors', url: 'https://i.postimg.cc/fL20hVKv/LABOMBONERABOCAJUNIORS.jpg', crest: 'https://i.postimg.cc/50jZytQp/escudito-de-boca.png' }
];

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dni, setDni] = useState('');
  const [selectedBackground, setSelectedBackground] = useState(backgrounds[0]);
  const { register } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await register(name, username, email, password, dni, selectedBackground.url);
    if (success) {
      router.push('/');
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
            <form onSubmit={handleRegister}>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Crea tu Cuenta</CardTitle>
                <CardDescription>Completa tus datos para unirte a SUDONE</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre y Apellido</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="username">Nombre de Usuario</Label>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="dni">DNI</Label>
                  <Input id="dni" value={dni} onChange={(e) => setDni(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label>Elige tu Equipo</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {backgrounds.map(bg => (
                            <button 
                                key={bg.name} 
                                type="button" 
                                onClick={() => setSelectedBackground(bg)}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 ${selectedBackground.name === bg.name ? 'border-primary' : 'border-transparent'}`}>
                                <Image src={bg.crest} alt={bg.name} width={40} height={40} />
                                <span className="text-xs mt-1">{bg.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrarme
                </Button>
                <Button variant="link" asChild>
                    <Link href="/login">¿Ya tienes una cuenta? Inicia Sesión</Link>
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    );
}
