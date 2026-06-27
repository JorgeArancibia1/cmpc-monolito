import { IVA_RATE, applyDiscount, priceBreakdown, roundMoney } from './money';

describe('money', () => {
  it('roundMoney redondea half-up', () => {
    expect(roundMoney(8491.5)).toBe(8492);
    expect(roundMoney(8491.4)).toBe(8491);
  });

  it('priceBreakdown descompone el bruto y cuadra exacto (neto + iva = total)', () => {
    const b = priceBreakdown(12990); // IVA 19%
    expect(b.net).toBe(10916);
    expect(b.iva).toBe(2074);
    expect(b.net + b.iva).toBe(b.total);
    expect(b.total).toBe(12990);
  });

  it('priceBreakdown acepta otra tasa y mantiene el cuadre', () => {
    const b = priceBreakdown(11900, 0.1);
    expect(b.net + b.iva).toBe(11900);
  });

  it('applyDiscount aplica el descuento redondeando una sola vez (half-up)', () => {
    expect(applyDiscount(12990, 0.2)).toBe(10392); // 12990 * 0.8
    expect(applyDiscount(9990, 0.15)).toBe(8492); // 9990 * 0.85 = 8491.5 → 8492
  });

  it('IVA_RATE es 19%', () => {
    expect(IVA_RATE).toBe(0.19);
  });
});
