# ADR 0003 — Autenticación JWT con rotación de refresh

**Estado:** Aceptada

## Contexto
Una SPA con una API sin estado necesita autenticación segura sin sesiones de servidor.

## Decisión
- **Access token** (15 min) en memoria del cliente.
- **Refresh token** (7 días) en cookie `httpOnly`/`secure`/`sameSite`, con su hash en la base
  de datos (rotación en cada uso).
- **RBAC** con guards globales; las escrituras requieren rol `ADMIN`.

## Consecuencias
- ✅ Mitiga XSS (el refresh no es accesible por JavaScript; el access es efímero).
- ✅ API sin estado → escalable horizontalmente.

## Alternativa descartada
Tokens en `localStorage` (vulnerable a XSS) o sesiones en servidor (rompen el modelo sin estado).
