# ADR 0005 — Validación por capas y errores claros

**Estado:** Aceptada

## Contexto
La entrada debe validarse exhaustivamente y los errores deben ser comprensibles para el usuario.

## Decisión
Validación en tres capas: **Zod** (entrada, esquemas compartidos), **reglas de negocio** en los
servicios y **restricciones `CHECK`** en la base de datos. Un filtro de excepciones global
traduce cualquier error a un mensaje en lenguaje simple; los errores de validación incluyen el
detalle por campo, que el formulario muestra junto a cada input.

## Consecuencias
- ✅ Cada campo se valida y el usuario recibe mensajes accionables, sin tecnicismos.
- ✅ Los detalles internos (base de datos, stack traces) nunca se exponen.

## Alternativa descartada
Devolver errores crudos del framework o de la base de datos al cliente.
