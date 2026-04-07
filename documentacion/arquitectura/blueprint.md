# Blueprint de Arquitectura

## Resumen

- Stack principal: Next.js + React + TypeScript.
- Base de datos: Firebase Realtime Database.
- Enfoque de datos: Realtime-only.
- Estado actual: sin uso directo de Firebase Storage en el codigo fuente principal.

## Capas del sistema

1. UI
- Rutas en `src/app`.
- Componentes en `src/components`.
- Contextos en `src/context`.

2. Logica de negocio
- Hooks en `src/hooks`.
- Validaciones en `src/lib/validators.ts` y esquemas de formularios.

3. Acceso a datos
- Cliente Firebase en `src/lib/firebase.ts`.
- Servicios por modulo en `src/lib/firebase/db/*`.
- Barrel de acceso en `src/lib/firebase/db/index.ts`.

## Rutas de datos principales (Realtime)

- `users`
- `teams`
- `tournaments`
- `matches`
- `posts`
- `conversations`
- `products`
- `manual_cash_entries`
- `app_config`

## Reglas y seguridad

- Reglas en `database.rules.json`.
- Principio de minimo acceso por usuario/rol.
- Sin autoelevacion de rol.
- Escrituras sensibles validadas por ownership o rol admin.

## Lineamientos de evolucion

- Mantener contratos de tipos centralizados en `src/lib/types.ts`.
- Evitar duplicar tipos en componentes.
- Evitar rutas legacy fuera de `src` para nuevas implementaciones.
- Cualquier migracion de datos debe ser compatible y gradual.

## Validacion tecnica minima

- `npm run typecheck`
- `npm run build`
- Smoke manual de flujos criticos
