'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Shield, CalendarDays, MessageSquare, ShoppingBag, UserCircle2, Trophy, ArrowRight, Home } from 'lucide-react';

const toc = [
  { id: 'inicio', label: 'Inicio rapido' },
  { id: 'roles', label: 'Roles y permisos' },
  { id: 'flujos', label: 'Flujos principales' },
  { id: 'faq', label: 'Preguntas frecuentes' },
  { id: 'soporte', label: 'Soporte' },
];

export default function GuiaPage() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6 lg:gap-8">
        <aside className="lg:sticky lg:top-6 h-fit">
          <Card className="bg-secondary/40 border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Indice de la guia</CardTitle>
              <CardDescription>Navega por secciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-6">
          <section id="inicio">
            <Card className="overflow-hidden border-border/60">
              <div className="h-1 bg-gradient-to-r from-accent-red via-accent-blue to-accent-red" />
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Guia oficial</Badge>
                  <Badge variant="outline">Version inicial</Badge>
                </div>
                <CardTitle className="text-2xl">Guia de Usuario de Fulbo</CardTitle>
                <CardDescription>
                  Esta guia te muestra como usar la plataforma, que puede hacer cada rol y como resolver dudas comunes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3 bg-background/60"><p className="text-xs text-muted-foreground">Paso 1</p><p className="font-medium">Inicia sesion</p></div>
                  <div className="rounded-lg border p-3 bg-background/60"><p className="text-xs text-muted-foreground">Paso 2</p><p className="font-medium">Configura tu perfil</p></div>
                  <div className="rounded-lg border p-3 bg-background/60"><p className="text-xs text-muted-foreground">Paso 3</p><p className="font-medium">Empieza a jugar</p></div>
                </div>
                <Button asChild className="w-full sm:w-auto">
                  <a href="#flujos">Ver flujos principales <ArrowRight className="ml-2 h-4 w-4" /></a>
                </Button>
              </CardContent>
            </Card>
          </section>

          <section id="roles" className="space-y-4">
            <h2 className="text-xl font-semibold">Roles y permisos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><Shield className="h-5 w-5 text-accent-red" /> Dios</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">Acceso total a toda la plataforma.</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><CalendarDays className="h-5 w-5 text-accent-blue" /> Organizador</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">Gestion de torneos, equipos y operaciones habilitadas por negocio.</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><UserCircle2 className="h-5 w-5 text-foreground" /> Director Tecnico</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">Gestion deportiva de su equipo y funciones tecnicas permitidas.</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><Trophy className="h-5 w-5 text-amber-400" /> Jugador</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">Uso general: perfil, torneos, interaccion social y tienda.</CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          <section id="flujos" className="space-y-4">
            <h2 className="text-xl font-semibold">Flujos principales</h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3"><Home className="h-5 w-5 mt-0.5 text-accent-blue" /><div><p className="font-medium">Inicio y feed</p><p className="text-sm text-muted-foreground">Ver publicaciones, comentar y reaccionar segun permisos.</p></div></div>
                <div className="flex items-start gap-3"><CalendarDays className="h-5 w-5 mt-0.5 text-accent-blue" /><div><p className="font-medium">Torneos</p><p className="text-sm text-muted-foreground">Inscripcion, seguimiento de ligas y vista de torneos activos.</p></div></div>
                <div className="flex items-start gap-3"><MessageSquare className="h-5 w-5 mt-0.5 text-accent-blue" /><div><p className="font-medium">Mensajeria</p><p className="text-sm text-muted-foreground">Conversaciones en tiempo real entre usuarios.</p></div></div>
                <div className="flex items-start gap-3"><ShoppingBag className="h-5 w-5 mt-0.5 text-accent-blue" /><div><p className="font-medium">Tienda</p><p className="text-sm text-muted-foreground">Explorar productos, carrito y checkout.</p></div></div>
              </CardContent>
            </Card>
          </section>

          <section id="faq" className="space-y-4">
            <h2 className="text-xl font-semibold">Preguntas frecuentes</h2>
            <Card>
              <CardContent className="pt-6 space-y-3 text-sm">
                <div>
                  <p className="font-medium">No veo una opcion del menu, por que?</p>
                  <p className="text-muted-foreground">Depende de tu rol y permisos asignados.</p>
                </div>
                <div>
                  <p className="font-medium">No puedo publicar o gestionar algo, que hago?</p>
                  <p className="text-muted-foreground">Verifica sesion activa y rol actual. Si persiste, contacta soporte.</p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section id="soporte" className="space-y-4">
            <h2 className="text-xl font-semibold">Soporte</h2>
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Si reportas un error, envia: pantalla, accion realizada y mensaje exacto.
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
