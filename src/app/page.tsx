import * as React from 'react';

export default function Home() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Inicio / Feed</h1>
      <p className="text-muted-foreground">
        Aquí se mostrará el formulario para crear publicaciones y el feed con
        las publicaciones de administradores, editores y usuarios favoritos.
      </p>
    </div>
  );
}
