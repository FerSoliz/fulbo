'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function PostContentPage() {
  const { user: currentUser, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!currentUser || currentUser.role !== 'admin')) {
      router.replace('/');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser || currentUser.role !== 'admin') {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  const handlePublish = (event: React.FormEvent) => {
    event.preventDefault();
    // Lógica para publicar el post en Firebase (la implementaremos más adelante)
    console.log('Publicando contenido...');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Crear Nueva Publicación"
        description="Escribe y publica noticias, anuncios o cualquier contenido en el feed principal."
      />
      <Card className="max-w-2xl mx-auto mt-6">
        <CardHeader>
          <CardTitle>Nuevo Post</CardTitle>
          <CardDescription>Este contenido será visible para todos los usuarios en la red social.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePublish} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="post-title">Título</Label>
              <Input id="post-title" placeholder="Ej: ¡Nuevo torneo de verano!" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-content">Contenido</Label>
              <Textarea
                id="post-content"
                placeholder="Escribe los detalles de tu publicación aquí..."
                rows={8}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Publicar Post</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
