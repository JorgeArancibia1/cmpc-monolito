# ADR 0004 — Soft delete y auditoría transversal

**Estado:** Aceptada

## Contexto
Se requiere conservar la trazabilidad de las eliminaciones y registrar las operaciones.

## Decisión
- **Soft delete** con `deletedAt`: el borrado marca la fila y las lecturas filtran los registros
  vigentes de forma centralizada (`notDeleted`).
- **Auditoría** mediante un **interceptor** global que registra cada mutación (alta, edición,
  borrado) en `audit_logs` con usuario, IP y diferencia en JSON.

## Consecuencias
- ✅ Trazabilidad completa y posibilidad de restauración.
- ✅ La auditoría no se repite en cada servicio (responsabilidad única).

## Alternativa descartada
Borrado físico (pierde historial) y registrar dentro de cada servicio (duplica lógica).
