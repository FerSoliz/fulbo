# Entornos y Secretos

- Estado: vigente
- Objetivo: operar con entornos claros y manejo seguro de variables.

## Entornos recomendados

- `development`: pruebas locales y cambios en curso.
- `staging`: validacion pre-produccion.
- `production`: entorno real.

## Variables base esperadas

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Reglas de seguridad

- No commitear secretos reales.
- Rotar cualquier token sensible expuesto por error.
- Usar `.env.local` solo para local.
- Mantener un `.env.example` sin valores reales.

## Checklist operativo rapido

- [ ] Variables de entorno cargadas por entorno.
- [ ] Tokens sensibles rotados si hubo exposicion.
- [ ] Deploy validado en `staging` antes de `production`.
