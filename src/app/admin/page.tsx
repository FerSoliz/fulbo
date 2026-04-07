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
  Users,
  ArrowRight,
  UserCog,
  Store,
  Landmark,
} from 'lucide-react';
import Link from 'next/link';
import type { User } from '@/lib/types'; // CORREGIDO: Importar desde la fuente de verdad
import { useUser } from '@/context/user-context';
import { useRouter } from 'next/navigation';
import { canAccessAdminPanel, hasRole } from '@/lib/auth/roles';

const allAdminActions = [
  {
    title: 'Crear Nueva Competencia',
    description: 'Configura una nueva liga o copa desde cero, define su formato y equipos.',
    icon: PlusCircle,
    href: '/admin/create-competition',
    color: 'bg-green-500 hover:bg-green-600',
    allowedRoles: ['dios'],
  },
  {
    title: 'Administrar Torneos',
    description: 'Gestiona el fixture, los resultados y las estadísticas de los torneos creados.',
    icon: Settings,
    href: '/admin/manage-tournaments',
    color: 'bg-blue-500 hover:bg-blue-600',
    allowedRoles: ['dios', 'organizador'],
  },
  {
    title: 'Gestionar Tienda',
    description: 'Añade, edita o elimina productos del merchandising de la SUDSTORE.',
    icon: Store,
    href: '/admin/store',
    color: 'bg-red-500 hover:bg-red-600',
    allowedRoles: ['dios', 'organizador'],
  },
  {
    title: 'Administrar Usuarios',
    description: 'Gestiona roles, permisos y acceso de todos los usuarios de la plataforma.',
    icon: UserCog,
    href: '/admin/manage-users',
    color: 'bg-orange-500 hover:bg-orange-600',
    allowedRoles: ['dios'],
  },
  {
    title: 'Gestionar Equipos',
    description: 'Administra las plantillas, logos y datos de los equipos inscritos.',
    icon: Users,
    href: '/admin/manage-teams',
    color: 'bg-purple-500 hover:bg-purple-600',
    allowedRoles: ['dios', 'organizador'],
  },
  {
    title: 'Caja',
    description: 'Gestiona los ingresos y egresos de los partidos.',
    icon: Landmark,
    href: '/admin/caja',
    color: 'bg-yellow-500 hover:bg-yellow-600',
    allowedRoles: ['dios', 'organizador'],
  },
];

const allowedRolesForPage: Array<User['role']> = ['dios', 'organizador', 'admin', 'vendedor'];

export default function AdminPage() {
  const { user: currentUser, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!currentUser || !canAccessAdminPanel(currentUser))) {
        router.replace('/');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser || !canAccessAdminPanel(currentUser)) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  // Filtrar acciones basadas en el rol del usuario
  const visibleActions = allAdminActions.filter(action =>
    action.allowedRoles.some((role) => hasRole(currentUser, role as any))
  );

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
          {visibleActions.map((action) => {
            return (
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
