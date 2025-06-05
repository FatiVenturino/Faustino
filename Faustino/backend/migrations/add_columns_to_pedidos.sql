-- Agregar columnas a la tabla pedidos
ALTER TABLE pedidos
ADD COLUMN direccion_entrega TEXT,
ADD COLUMN notas TEXT; 