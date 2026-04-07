# Prompt System

- Estado: vigente
- Objetivo: definir como se gestionan prompts para IA en el proyecto.

## Fuentes actuales

- Reglas de trabajo IA: `.idx/airules.md`
- Contexto operacional IA: `documentacion/dev/ai-contexto-inicial.md`

## Estandar recomendado

- Prompt base (sistema): objetivos, limites, seguridad y estilo.
- Prompt de tarea: alcance puntual por modulo/flujo.
- Contexto de verdad: siempre referenciar documentos oficiales del repo.

## Reglas

- No inventar estructura de datos.
- No cambiar contratos sin documentar.
- No introducir cambios destructivos sin plan aprobado.
- Cada cambio relevante de prompt debe quedar versionado en git.
- Toda tarea ejecutada debe registrar evidencia documental.
- Evitar repetir la misma tarea sin una causa concreta.

## Versionado

- Cambios de prompt se registran en PR con motivo y riesgo.
- Si el cambio altera comportamiento, agregar nota en checklist operativo.
