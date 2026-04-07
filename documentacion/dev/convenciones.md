# Convenciones de Desarrollo

## Estandares base

- TypeScript como base del proyecto.
- Imports limpios y sin duplicar fuentes de tipos.
- Evitar logica de datos en componentes de UI cuando exista servicio.

## Estructura recomendada

- `src/app`: paginas y rutas.
- `src/components`: UI reutilizable.
- `src/hooks`: logica reutilizable de cliente.
- `src/lib/firebase/db`: acceso a datos por modulo.
- `src/lib/types.ts`: contratos de tipos centralizados.

## Reglas de calidad

- Antes de merge: `npm run typecheck` y `npm run build`.
- No agregar referencias nuevas a Storage.
- Mantener enfoque Realtime-only.
- Mantener permisos alineados con `database.rules.json`.

## Documentacion

- Documentar decisiones importantes en `documentacion/`.
- Mantener actualizado `documentacion/README.md` como indice.
