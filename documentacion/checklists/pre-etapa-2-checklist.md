# Pre Etapa 2 - Checklist Senior

- Fecha: 2026-04-06
- Estado: Listo para iniciar etapa 2 formal (pendiente QA manual completa)
- Objetivo: dejar base tecnica, seguridad y orden documental en nivel alto antes del nuevo ciclo.

## 1) Base tecnica

- [x] Proyecto compila (`npm run build`).
- [x] Tipos en verde (`npm run typecheck`).
- [x] Documentacion centralizada en `documentacion/`.
- [x] Naming de docs normalizado (`kebab-case`) para nuevos archivos.

## 2) Seguridad

- [x] Reglas de Realtime reforzadas en `database.rules.json`.
- [x] Roles legacy removidos de flujos clave (`captain`, `editor`).
- [x] Mensajeria unificada sobre Realtime.
- [x] Eliminado uso directo de Storage en codigo principal.

## 3) Calidad de repo

- [x] Estructura documental ordenada (`arquitectura`, `producto`, `dev`, `checklists`, `plantillas`).
- [x] Archivo temporal de pruebas removido (`src/components/temp-firestore-test.tsx`).
- [x] Carpetas documentales viejas removidas (`docs/`, `checklist operativos/`).
- [x] Build artifacts de PWA limpiados despues de validar (`public/sw.js`, `public/workbox-4754cb34.js`).

## 4) Riesgo de dependencias (audit)

- [x] Auditoria corrida con `npm audit --omit=dev`.
- [x] Riesgo alto/critico cerrado.
- [ ] Riesgo total cerrado al 100%.

Estado actual de audit:
- Se corrio `npm audit fix` sin modo forzado y se bajo el riesgo total.
- Se subio `next` a `15.5.14` para cerrar advisories de alto impacto.
- Se removio `next-pwa` y su cadena vulnerable (`workbox` / `serialize-javascript`) del runtime.
- 19 vulnerabilidades reportadas (19 low, 0 high, 0 critical).
- Lo pendiente actual es deuda de bajo impacto ligada principalmente a la cadena `genkit` / `firebase-admin`.

Plan de cierre recomendado para este punto:
1. Crear rama exclusiva de hardening de dependencias.
2. Evaluar actualizacion controlada del stack `genkit` para bajar vulnerabilidades low.
3. Repetir `typecheck` + `build` + smoke funcional por cada lote.
4. Cerrar con `npm audit --omit=dev` y reporte comparativo antes/despues.

## 5) QA funcional (previo a etapa 2)

- [ ] QA manual completa de flujos criticos.

Casos minimos obligatorios:
- Registro, login y recuperacion.
- Perfil y cambios de datos.
- Feed: publicar, comentar, reaccionar.
- Torneos: vista y gestion admin.
- Equipos y plantel.
- Mensajeria.
- Tienda, checkout y caja admin.

## 6) Condicion de salida (GO a etapa 2)

Para declarar inicio formal de etapa 2 deben estar en verde estos puntos:

- [x] Build estable.
- [x] Typecheck estable.
- [ ] QA funcional completa ejecutada y evidenciada.
- [x] Audit sin criticas ni altas abiertas.

## 7) Conclusion ejecutiva

La base de codigo ya esta fuerte y ordenada para avanzar. Falta un cierre formal para nivel "de mil":

1. corrida QA manual completa con evidencia.

Con ese punto cerrado, el inicio de etapa 2 queda habilitado sin deuda de riesgo relevante.
