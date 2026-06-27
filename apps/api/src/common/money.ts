/**
 * Utilidades monetarias. Los montos se manejan como **enteros en la unidad mínima de la divisa**
 * (CLP = pesos, sin centavos). El IVA y los descuentos se derivan con **redondeo half-up explícito**.
 *
 * El IVA se calcula por *back-calculation* desde el precio bruto (IVA incluido), de modo que
 * `neto + iva = total` siempre cuadre exacto — clave para que una boleta no descuadre ante el SII.
 * La emisión de DTE queda fuera de alcance; esto es la base de cálculo reutilizable.
 */
export const IVA_RATE = 0.19;

/** Redondeo comercial (half-up) a entero. Para montos positivos equivale a `Math.round`. */
export function roundMoney(value: number): number {
  return Math.round(value);
}

export interface PriceBreakdown {
  /** Monto neto (base imponible). */
  net: number;
  /** IVA derivado. */
  iva: number;
  /** Total bruto (IVA incluido) = neto + iva. */
  total: number;
}

/**
 * Descompone un precio **bruto** (IVA incluido) en neto + IVA.
 * `iva` se obtiene como `total - net` para garantizar el cuadre exacto (sin descuadres de 1 peso).
 */
export function priceBreakdown(grossTotal: number, rate = IVA_RATE): PriceBreakdown {
  const net = roundMoney(grossTotal / (1 + rate));
  return { net, iva: grossTotal - net, total: grossTotal };
}

/**
 * Aplica un descuento porcentual (`fraction` entre 0 y 1) sobre el bruto.
 * Se redondea **una sola vez** al final para no acumular deriva.
 */
export function applyDiscount(gross: number, fraction: number): number {
  return roundMoney(gross * (1 - fraction));
}
