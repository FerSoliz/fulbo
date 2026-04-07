# 00 - Contexto Inicial

Si acabas de entrar al proyecto (persona o IA), empieza por aqui.

## Orden de lectura recomendado

1. `documentacion/00-contexto-inicial.md` (este archivo)
2. `documentacion/README.md` (indice general)
3. `documentacion/dev/ai-contexto-inicial.md` (fuentes de verdad)
4. `documentacion/dev/directrices-reconstruccion.md` (como trabajar)
5. `documentacion/producto/plataforma.md` (negocio y modulos)
6. `documentacion/arquitectura/blueprint.md` (arquitectura tecnica)

## Fuentes de verdad (resumen rapido)

- Tipos globales: `src/lib/types.ts`
- Datos y servicios: `src/lib/firebase/db/*`
- Seguridad de datos: `database.rules.json`
- Config app: `next.config.ts`

## Regla operativa para IA (obligatoria)

- Toda implementacion o tarea debe dejar evidencia documental.
- Si se toca arquitectura o contratos de datos, documentar decision y motivo.
- No repetir la misma tarea una y otra vez si ya fue completada.
- Solo re-ejecutar una tarea cuando:
  - fallo la ejecucion anterior,
  - cambio el alcance,
  - o el usuario lo pidio explicitamente.
- Toda tarea debe registrarse en `documentacion/checklists/registro-tareas.md`.

## Donde se documenta cada cosa

- Estado de ejecucion y cierres: `documentacion/checklists/*.md`
- Bitacora obligatoria: `documentacion/checklists/registro-tareas.md`
- Reglas de trabajo: `documentacion/dev/convenciones.md`
- Reconstruccion y gobierno tecnico: `documentacion/dev/directrices-reconstruccion.md`
- Contexto para IA: `documentacion/dev/ai-contexto-inicial.md`
