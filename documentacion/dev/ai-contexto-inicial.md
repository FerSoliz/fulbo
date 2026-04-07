# AI Contexto Inicial (Fuente de Verdad)

- Estado: vigente
- Objetivo: dar contexto rapido a cualquier IA/agente que trabaje en este repo.

## 1) Fuentes de verdad del proyecto

- Producto y alcance funcional: `documentacion/producto/plataforma.md`
- Arquitectura actual: `documentacion/arquitectura/blueprint.md`
- Convenciones de trabajo: `documentacion/dev/convenciones.md`
- Directrices de reconstruccion: `documentacion/dev/directrices-reconstruccion.md`
- Estado operativo y QA: `documentacion/checklists/*.md`

## 2) Fuentes de verdad del codigo

- Tipos globales: `src/lib/types.ts`
- Capa Firebase cliente: `src/lib/firebase.ts`
- Acceso a datos: `src/lib/firebase/db/*`
- Reglas de seguridad Realtime: `database.rules.json`
- Configuracion principal Next: `next.config.ts`

## 3) Decisiones tecnicas vigentes

- Base de datos operativa: Firebase Realtime Database.
- Sin uso directo de Firebase Storage en logica nueva.
- Soporte de URLs legacy permitido para lectura de medios antiguos.
- Mensajeria unificada en Realtime.

## 4) Reglas para cambios seguros

- No romper flujos existentes.
- No introducir cambios destructivos en datos.
- Evitar cambios de estructura sin plan de migracion.
- Todo cambio relevante debe dejar evidencia (checklist/ADR).
- No repetir tareas ya completadas sin causa valida.
- Re-ejecutar solo por fallo, nuevo alcance o pedido explicito.

## 5) Validacion minima obligatoria

- `npm run typecheck`
- `npm run build`
- Verificacion funcional del flujo afectado

## 6) Definition of Done (DoD)

- Codigo compilando.
- Sin regresion funcional en flujo tocado.
- Documentacion actualizada.
- Riesgo de seguridad no incrementado.
