# 0008 — Modelo monetario, IVA y redondeo

## Estado
Aceptada.

## Contexto
CMPC-libros es una tienda chilena. El dinero exige decisiones explícitas: tipo de dato del precio,
manejo del IVA (19% en Chile; el libro **no** está exento), redondeo y preparación para otra divisa.

## Decisión

### Precio como entero en la unidad mínima de la divisa
`books.price` es **`INTEGER`**, no `DECIMAL`. Representa el **precio de venta al público (bruto, IVA
incluido)** en la unidad mínima de la moneda. Para **CLP son pesos enteros** (el peso no tiene
centavos); para una moneda con subunidad serían sus *minor units* (p. ej. centavos en USD).

Motivo: el argumento de "evitar errores de `float`" aplica a monedas con fracción (centavos); en CLP
el monto es entero por naturaleza, así que el entero es la representación **exacta y fiel al dominio**.
Usar `DECIMAL(10,2)` en una moneda sin centavos guarda un `.00` que nunca se usa.

### Divisa explícita (`currency`, ISO-4217, default `CLP`)
Es el *hook* de escalabilidad: el modelo `monto entero + divisa` admite otra moneda **sin migrar la
precisión** del esquema (cada divisa redondea a su unidad mínima). Conversión de divisas y tasas de
cambio quedan **fuera de alcance**.

### IVA derivado, no almacenado
El IVA (constante configurable, `0.19`) se calcula por **back-calculation** desde el bruto:

```
neto = round(total / 1,19)
iva  = total − neto        // garantiza neto + iva = total exacto
```

Se obtiene `iva` como `total − neto` (no como `round(neto·0,19)`) para que **siempre cuadre**. Esto es
clave para no descuadrar una boleta ante el SII. Helper en `apps/api/src/common/money.ts`.

### Redondeo
- **Half-up a entero** (redondeo comercial). Estadísticamente casi neutro → no sesga el débito fiscal.
- En descuentos: **descuento antes que IVA** y se redondea **una sola vez** al final (sin deriva).
- El redondeo de **efectivo** a $10 (convención chilena por falta de monedas) es un tema de *momento de
  pago*, no del catálogo → fuera de alcance.

## Por qué el redondeo no descuadra ante el SII
La conciliación es **por documento** (back-calc ⇒ neto+iva=total) y el F29 mensual **suma** los IVA
emitidos (no los recalcula). Los valores emitidos son inmutables; la contabilidad suma lo emitido.

## Fuera de alcance (documentado a propósito)
Emisión de DTE (boletas/facturas), IVA multi-línea, tasas de cambio y redondeo de efectivo. El modelo
los soporta; no se implementan en esta entrega de inventario.

## Consecuencias
- (+) Exacto, fiel al dominio chileno y escalable a otra divisa sin migración de precisión.
- (+) Cálculo de IVA/descuento centralizado, testeado y reutilizable para la capa de checkout/boleta.
- (−) Si a futuro se vende en una moneda con subunidad, hay que poblar `currency` y manejar minor units
  en esa moneda (previsto en el diseño).
