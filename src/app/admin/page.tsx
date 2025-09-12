
'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  PlusCircle,
  Settings,
  Upload,
  Users,
  FileText,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import type { User } from '@/lib/data';
import { useUser } from '@/context/user-context';


const adminActions = [
  {
    title: 'Crear Nueva Competencia',
    description: 'Configura una nueva liga o copa desde cero, define su formato y equipos.',
    icon: PlusCircle,
    href: '/admin/create-competition',
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    title: 'Administrar Torneos',
    description: 'Edita, elimina y gestiona los torneos que ya has creado.',
    icon: Settings,
    href: '/admin/manage-tournaments',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    title: 'Cargar Resultados',
    description: 'Registra los marcadores, estadísticas y eventos de cada partido.',
    icon: Upload,
    href: '/admin/manage-tournaments', // Link to manager to select a tournament first
    color: 'bg-yellow-500 hover:bg-yellow-600',
  },
  {
    title: 'Gestionar Equipos',
    description: 'Administra las plantillas, logos y datos de los equipos inscritos.',
    icon: Users,
    href: '/admin/manage-tournaments', // Link to manager to select a tournament first
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    title: 'Postear Contenido',
    description: 'Crea y publica noticias, anuncios y actualizaciones en el feed principal.',
    icon: FileText,
    href: '/admin/post-content',
    color: 'bg-indigo-500 hover:bg-indigo-600',
  },
];

export default function AdminPage() {
  const { user: currentUser, loading } = useUser();

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'editor';

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-4">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold">Acceso Denegado</h1>
        <p className="text-muted-foreground mt-2">
          No tienes los permisos necesarios para acceder a esta sección.
        </p>
        <Link href="/">
          <Button className="mt-6">Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
          <p className="text-muted-foreground">
            Gestiona todos los aspectos de la plataforma desde aquí.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminActions.map((action) => (
            <Card key={action.title} className="flex flex-col">
              <CardHeader className="flex-row items-center gap-4">
                <div className={`p-3 rounded-lg ${action.color}`}>
                   <action.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                    <CardTitle>{action.title}</CardTitle>
                    <CardDescription className="mt-1">{action.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-grow"></CardContent>
              <CardContent>
                 <Link href={action.href}>
                  <Button className={`w-full ${action.color}`}>
                    Ir a {action.title}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

