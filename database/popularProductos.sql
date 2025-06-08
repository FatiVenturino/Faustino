-- Insertar Categorías (IDs implícitos desde 4)
-- Asegúrate de que la tabla esté vacía o uses secuencias adecuadas si usás AUTO_INCREMENT o SERIAL

INSERT INTO categorias (nombre, descripcion) VALUES
('Mariscos', 'Variedad de mariscos frescos y congelados.'),
('Congelados - Pollo', 'Productos de pollo congelados listos para cocinar.'),
('Congelados - Pescado', 'Pescados congelados listos para freír o cocinar.'),
('Congelados - Verduras', 'Verduras y medallones vegetales congelados.'),
('Pastas', 'Variedad de fideos, ñoquis y pastas especiales.'),
('Canastitas', 'Canastitas congeladas con diferentes rellenos.'),
('Pizzas', 'Pizzas congeladas listas para hornear.'),
('Tartas', 'Tartas saladas congeladas de diferentes sabores.');

-- Insertar Productos
-- Mariscos (Categoria ID 4)
INSERT INTO productos (categoria_id, nombre, descripcion, precio, stock, imagen, estado) VALUES
(4, 'Rodajas de merluza', 'Rodajas de merluza congeladas.', 11.50, 50, '/images/mariscos/rodajas_merluza.webp', 'activo'),
(4, 'Trucha', 'Trucha entera congelada.', 14.00, 30, '/images/mariscos/trucha.webp', 'activo'),
(4, 'Merluza', 'Filetes de merluza.', 13.20, 60, '/images/mariscos/merluza.webp', 'activo'),
(4, 'Lomitos de atún', 'Lomos de atún congelado.', 15.00, 35, '/images/mariscos/atun.webp', 'activo'),
(4, 'Salmón', 'Filetes de salmón.', 18.50, 25, '/images/mariscos/salmon.webp', 'activo'),
(4, 'Rabas', 'Anillas de calamar.', 10.80, 45, '/images/mariscos/rabas.webp', 'activo'),
(4, 'Langostinos', 'Langostinos crudos congelados.', 22.00, 40, '/images/mariscos/langostinos.webp', 'activo'),
(4, 'Bandeja de mariscos', 'Mix de mariscos.', 16.50, 50, '/images/mariscos/bandeja.webp', 'activo'),
(4, 'Pacú', 'Filete de pacú congelado.', 17.00, 20, '/images/mariscos/pacu.webp', 'activo'),
(4, 'Camarones', 'Camarones pelados.', 19.00, 30, '/images/mariscos/camarones.webp', 'activo'),
(4, 'Medallón de Salmón', 'Medallones de salmón congelado.', 14.90, 25, '/images/mariscos/medallon_salmon.webp', 'activo'),
(4, 'Mejillón pelado', 'Mejillones sin cáscara.', 9.90, 40, '/images/mariscos/mejillon.webp', 'activo'),
(4, 'Vieyras', 'Vieyras congeladas.', 23.00, 15, '/images/mariscos/vieyras.webp', 'activo');

-- Congelados - Pollo (Categoria ID 5)
INSERT INTO productos (categoria_id, nombre, descripcion, precio, stock, imagen, estado) VALUES
(5, 'Albondigas de Pollo', 'Albóndigas de pollo listas para cocinar.', 8.00, 60, '/images/pollo/albondigas.webp', 'activo'),
(5, 'Arrollado de Pollo', 'Arrollado relleno.', 10.00, 40, '/images/pollo/arrolado.webp', 'activo'),
(5, 'Suprema de Pollo', 'Supremas rebozadas.', 9.00, 50, '/images/pollo/suprema.webp', 'activo'),
(5, 'Medallón de Pollo', 'Medallones clásicos.', 7.50, 70, '/images/pollo/medallon.webp', 'activo'),
(5, 'Medallón de Pollo con Espinaca y Queso', 'Rellenos con espinaca y queso.', 8.00, 60, '/images/pollo/espinaca.webp', 'activo'),
(5, 'Medallón de Pollo con Jamón y Queso', 'Rellenos con jamón y queso.', 8.00, 60, '/images/pollo/jamon_queso.webp', 'activo'),
(5, 'Nuggets de Pollo', 'Nuggets crocantes.', 6.90, 80, '/images/pollo/nuggets.webp', 'activo'),
(5, 'Dinosaurios de Pollo', 'Nuggets con formas divertidas.', 7.20, 65, '/images/pollo/dinosaurios.webp', 'activo'),
(5, 'Patitas de Pollo', 'Patitas tradicionales.', 6.50, 70, '/images/pollo/patitas.webp', 'activo'),
(5, 'Patitas de Pollo con Jamón y Queso', 'Rellenas con jamón y queso.', 7.00, 60, '/images/pollo/patitas_jq.webp', 'activo'),
(5, 'Pechuguitas de Pollo a la Romana', 'Rebozadas estilo romana.', 9.00, 55, '/images/pollo/romana.webp', 'activo'),
(5, 'Deditos de Pollo', 'Fingers de pollo.', 7.00, 65, '/images/pollo/deditos.webp', 'activo');

-- Congelados - Pescado (Categoria ID 6)
INSERT INTO productos (categoria_id, nombre, descripcion, precio, stock, imagen, estado) VALUES
(6, 'Filet de Merluza Rebozado', 'Merluza rebozada lista para freír.', 11.00, 50, '/images/pescado/rebozado.webp', 'activo'),
(6, 'Filet de Merluza Finas Hierbas', 'Saborizado con hierbas.', 11.50, 45, '/images/pescado/hierbas.webp', 'activo'),
(6, 'Filet de Merluza a la Romana', 'Rebozado romano.', 12.00, 40, '/images/pescado/romana.webp', 'activo'),
(6, 'Medallón de Merluza', 'Medallones tradicionales.', 10.00, 55, '/images/pescado/medallon.webp', 'activo'),
(6, 'Medallón de Merluza con Espinaca y Queso', 'Relleno de espinaca y queso.', 10.50, 50, '/images/pescado/espinaca.webp', 'activo'),
(6, 'Crocante de Merluza', 'Con cobertura crocante.', 11.20, 40, '/images/pescado/crocante.webp', 'activo');

-- Congelados - Verduras (Categoria ID 7)
INSERT INTO productos (categoria_id, nombre, descripcion, precio, stock, imagen, estado) VALUES
(7, 'Medallón de Arroz Yamani y Lentejas', 'A base de arroz y legumbres.', 6.50, 40, '/images/verduras/medallon_yamani.webp', 'activo'),
(7, 'Croquetas de papa con Jamón y Queso', 'Croquetas rellenas.', 7.00, 50, '/images/verduras/croquetas.webp', 'activo'),
(7, 'Medallón de Espinaca', 'Vegetariano.', 6.00, 60, '/images/verduras/espinaca.webp', 'activo'),
(7, 'Medallón de Garbanzos', 'Rico en proteínas.', 6.50, 55, '/images/verduras/garbanzos.webp', 'activo'),
(7, 'Nuggets de Brócoli', 'Alternativa vegetal.', 7.20, 50, '/images/verduras/brocoli.webp', 'activo'),
(7, 'Milanesas de Arroz y Vegetales', 'Ideal para dieta vegetariana.', 6.80, 40, '/images/verduras/arroz_vegetales.webp', 'activo'),
(7, 'Milanesa de Soja con Calabaza', 'Vegano.', 6.50, 45, '/images/verduras/soja_calabaza.webp', 'activo'),
(7, 'Papas Noisette', 'Bolas de papa crocantes.', 5.50, 70, '/images/verduras/noisette.webp', 'activo'),
(7, 'Papas Carita', 'Papas con forma divertida.', 5.00, 60, '/images/verduras/carita.webp', 'activo'),
(7, 'Bocaditos de Espinaca', 'Mini porciones.', 5.20, 55, '/images/verduras/bocadito_espinaca.webp', 'activo'),
(7, 'Bocaditos de Calabaza y Queso', 'Rellenos con queso.', 5.80, 50, '/images/verduras/bocadito_calabaza.webp', 'activo'),
(7, 'Bastoncitos de Muzzarella', 'Queso rebozado.', 6.90, 45, '/images/verduras/muzzarella.webp', 'activo');

-- Pastas (Categoria ID 8)
INSERT INTO productos (categoria_id, nombre, descripcion, precio, stock, imagen, estado) VALUES
(8, 'Fideos Nº 1', 'Fideos clásicos.', 3.50, 100, '/images/pastas/fideos1.webp', 'activo'),
(8, 'Fideos Nº 2', 'Fideos finos.', 3.50, 100, '/images/pastas/fideos2.webp', 'activo'),
(8, 'Fideos Nº 3', 'Fideos medianos.', 3.50, 100, '/images/pastas/fideos3.webp', 'activo'),
(8, 'Fideos Nº 4', 'Fideos gruesos.', 3.50, 100, '/images/pastas/fideos4.webp', 'activo'),
(8, 'Fusiless', 'Pasta en espiral.', 3.80, 90, '/images/pastas/fusiles.webp', 'activo'),
(8, 'Ñoquis', 'De papa congelados.', 4.00, 85, '/images/pastas/noquis.webp', 'activo'),
(8, 'Fideos verdes Nº 1', 'Con espinaca.', 4.00, 80, '/images/pastas/verdes1.webp', 'activo'),
(8, 'Fideos verdes Nº 4', 'Espinaca y albahaca.', 4.00, 80, '/images/pastas/verdes4.webp', 'activo'),
(8, 'Fideos morrón Nº 1', 'Sabor morrón.', 4.20, 80, '/images/pastas/morron1.webp', 'activo'),
(8, 'Fideos morrón Nº 4', 'Intenso sabor morrón.', 4.20, 80, '/images/pastas/morron4.webp', 'activo');

-- Canastitas (Categoria ID 9)
INSERT INTO productos (categoria_id, nombre, descripcion, precio, stock, imagen, estado) VALUES
(9, 'Canastita Calabresa', 'Con salame y queso.', 6.00, 40, '/images/canastitas/calabresa.webp', 'activo'),
(9, 'Canastita Humita', 'Con choclo.', 6.00, 40, '/images/canastitas/humita.webp', 'activo'),
(9, 'Canastita Capresse', 'Tomate y albahaca.', 6.00, 40, '/images/canastitas/capresse.webp', 'activo');

-- Pizzas (Categoria ID 10)
INSERT INTO productos (categoria_id, nombre, descripcion, precio, stock, imagen, estado) VALUES
(10, 'Pizza Muzzarella', 'Clásica de queso.', 7.50, 50, '/images/pizzas/muzzarella.webp', 'activo'),
(10, 'Pizza Jamón y Queso', 'Con jamón cocido.', 8.00, 50, '/images/pizzas/jamon_queso.webp', 'activo');

-- Tartas (Categoria ID 11)
INSERT INTO productos (categoria_id, nombre, descripcion, precio, stock, imagen, estado) VALUES
(11, 'Tarta de Calabacín y Queso', 'Rellena con calabacín y queso.', 7.20, 40, '/images/tartas/calabacin_queso.webp', 'activo'),
(11, 'Tarta de Verdura', 'Verdura mixta.', 6.80, 45, '/images/tartas/verdura.webp', 'activo'),
(11, 'Tarta Jamón y Queso', 'Clásica de jamón y queso.', 7.50, 40, '/images/tartas/jamon_queso.webp', 'activo');
