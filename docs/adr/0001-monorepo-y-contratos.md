# ADR 0001 — Monorepo con contratos compartidos

**Estado:** Aceptada

## Contexto
El sistema tiene dos aplicaciones (API y SPA) que comparten la forma de los datos y las reglas
de validación.

## Decisión
Monorepo con `pnpm workspaces` y un paquete `@cmpc/contracts` que define los **esquemas Zod**
y los **tipos** del dominio. El backend los usa para validar la entrada y generar OpenAPI
(vía `nestjs-zod`); el frontend, para validar los formularios (React Hook Form).

## Consecuencias
- ✅ Una sola fuente de verdad para validación y tipos → sin duplicación ni desincronización.
- ✅ Mensajes de validación idénticos en cliente y servidor.
- ✅ Despliegue independiente de cada aplicación.

## Alternativa descartada
Definir tipos y validaciones por separado en cada app: genera duplicación y divergencias.
