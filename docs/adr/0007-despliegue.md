# ADR 0007 — Estrategia de despliegue

**Estado:** Aceptada

## Contexto
El sistema debe desplegarse de forma sencilla y con bajo costo operativo.

## Decisión
- **Frontend → Vercel**: SPA estática servida por CDN; despliegue por `git push`.
- **Backend → Render**: contenedor Docker; aplica migraciones al arrancar; health check en
  `/api/health`.
- **Base de datos → PostgreSQL gestionado (Neon)**: cadena *pooled* en `DATABASE_URL` y directa
  en `DIRECT_URL`.
- **Imágenes → Cloudinary**: almacenamiento persistente (el sistema de archivos del contenedor
  es efímero).
- **Local → Docker Compose**: levanta todo el stack con un comando.

## Consecuencias
- ✅ Cada capa usa la plataforma más adecuada; despliegue continuo.
- ➖ El plan de cómputo gratuito puede suspender el backend tras inactividad (arranque en frío).
