# ADR 0002 — Prisma + PostgreSQL, modelo en BCNF

**Estado:** Aceptada

## Contexto
Se necesita una capa de datos tipada, con migraciones y un modelo normalizado e íntegro.

## Decisión
**Prisma 7** sobre PostgreSQL usando el *driver adapter* (`@prisma/adapter-pg`). El modelo se
normaliza hasta **BCNF**: catálogos `authors`/`publishers`/`genres` extraídos y la relación
Libro↔Autor resuelta con la tabla puente `book_authors`. La integridad se refuerza con
restricciones `CHECK` en la base de datos (precio y stock no negativos, año en rango válido) y
la disponibilidad se **deriva del stock** (sin columna duplicada).

## Consecuencias
- ✅ Cliente tipado, migraciones declarativas y reproducibles.
- ✅ Integridad garantizada en el motor, no solo en la aplicación.
- ✅ Transacciones (`$transaction`) para sincronizar la relación de autores de forma atómica.

## Alternativa descartada
Validar únicamente en la aplicación: deja la base de datos expuesta a estados inválidos.
