# Directrices de Reconstruccion

- Estado: vigente
- Objetivo: reconstruir la plataforma sin romper negocio, datos ni flujos criticos.

## Principios no negociables

- No romper flujos productivos existentes.
- No romper estructura de datos en Realtime.
- Cambios incrementales con compatibilidad hacia atras.
- Cada cambio relevante debe quedar documentado.
- Seguridad y permisos primero.

## Forma de trabajo senior

1. Definir alcance corto y medible por ciclo.
2. Diseñar contrato de datos antes de codificar.
3. Implementar por modulo, no por pantalla suelta.
4. Validar con `typecheck`, `build` y smoke de flujo.
5. Registrar decision tecnica (ADR) cuando cambie arquitectura.

## Reglas de codigo

- Una sola fuente de tipos: `src/lib/types.ts`.
- Servicios de datos en `src/lib/firebase/db/*`.
- UI sin logica de persistencia directa.
- Evitar duplicados de hooks, tipos y utilidades.
- Mantener enfoque Realtime-only para datos operativos.

## Regla de cambios en base de datos

- Nunca hacer cambios destructivos directos.
- Si cambia estructura: usar estrategia expand/contract.
- Mantener dual-read temporal cuando aplique.
- Eliminar legado solo con evidencia de no uso.

## Calidad minima por entrega

- `npm run typecheck` en verde.
- `npm run build` en verde.
- Validacion funcional del flujo impactado.
- Nota tecnica corta en `documentacion/checklists/` o ADR.

## Directriz IA para tareas e implementaciones

- Toda tarea implementada debe quedar documentada.
- Toda tarea implementada debe registrarse en `documentacion/checklists/registro-tareas.md`.
- No repetir implementaciones ya cerradas sin motivo.
- Repetir una tarea solo si hubo fallo, cambio de alcance o pedido explicito del usuario.
