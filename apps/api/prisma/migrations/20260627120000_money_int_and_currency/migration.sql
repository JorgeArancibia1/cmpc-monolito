-- El precio pasa de DECIMAL(10,2) a entero (unidad mínima de la divisa; CLP = pesos sin centavos).
-- ROUND preserva los datos existentes redondeando al entero más cercano.
ALTER TABLE "books" ALTER COLUMN "price" SET DATA TYPE INTEGER USING ROUND("price")::integer;

-- Divisa del monto (ISO-4217). Permite escalar a otra moneda sin migrar la precisión.
ALTER TABLE "books" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'CLP';

-- El CHECK existente "books_price_nonnegative" (price >= 0) sigue siendo válido para INTEGER.
