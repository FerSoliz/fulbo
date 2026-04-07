'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  {
    title: 'Primeros pasos',
    items: [
      'Registrate o inicia sesion.',
      'Completa tu perfil.',
      'Explora Inicio, Torneos, Ranking y Tienda.',
    ],
  },
  {
    title: 'Inicio y feed',
    items: [
      'En Inicio ves publicaciones de la comunidad.',
      'Si estas logueado, puedes publicar, comentar y reaccionar segun permisos.',
    ],
  },
  {
    title: 'Torneos',
    items: [
      'En Inscripciones puedes iniciar el proceso de participacion.',
      'En Ligas en curso puedes ver torneos activos y su detalle.',
    ],
  },
  {
    title: 'Mensajeria y tienda',
    items: [
      'Mensajeria: conversaciones en tiempo real.',
      'Tienda: agregar al carrito y avanzar a checkout.',
    ],
  },
  {
    title: 'Panel admin',
    items: [
      'Disponible solo para roles autorizados.',
      'Gestion de usuarios, torneos, tienda y caja.',
    ],
  },
];

export default function GuiaPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Guia de Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Esta guia resume como usar la plataforma de forma simple.
          </p>
        </CardContent>
      </Card>

      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle className="text-lg">{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              {section.items.map((item) => (
                <li key={item} className="text-sm text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
