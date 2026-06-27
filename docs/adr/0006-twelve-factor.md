# ADR 0006 — Metodología Twelve-Factor App

**Estado:** Aceptada

## Contexto
La aplicación debe ser portable, escalable y apta para despliegue continuo.

## Decisión
Adoptar los doce factores (https://12factor.net/es/):

| Factor | Cómo se cumple |
|--------|----------------|
| 1. Código base | Monorepo único bajo control de versiones |
| 2. Dependencias | Declaradas y aisladas (pnpm + lockfile) |
| 3. Configuración | En el entorno, validada con Zod al arrancar |
| 4. Backing services | Base de datos e imágenes como recursos conectables por URL/credenciales |
| 5. Construir/ejecutar | Etapas separadas (Docker multi-stage; migraciones en el arranque) |
| 6. Procesos | Sin estado (JWT; sin almacenamiento local) |
| 7. Asignación de puertos | El servicio escucha el puerto del entorno (`PORT`/`API_PORT`) |
| 8. Concurrencia | Escalable horizontalmente al ser sin estado |
| 9. Desechabilidad | Arranque rápido y apagado elegante (`enableShutdownHooks`) |
| 10. Paridad dev/prod | Mismo motor (PostgreSQL) e imágenes en todos los entornos |
| 11. Historiales | Logs como flujo de eventos a stdout |
| 12. Procesos de administración | Migraciones y seed como comandos puntuales |

## Consecuencias
- ✅ Despliegue reproducible y portable entre plataformas.
- ✅ Escalado y operación sencillos.
