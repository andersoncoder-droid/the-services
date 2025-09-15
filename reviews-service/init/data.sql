-- =====================================================
-- SCRIPT DE INICIALIZACIÓN - REVIEWS SERVICE
-- Base de datos para gestión de reseñas - ByteStore
-- =====================================================

-- Configurar charset de la base de datos
ALTER DATABASE reviews CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish2_ci;

-- =====================================================
-- TABLA: calificaciones (reseñas de productos)
-- Almacena las calificaciones y comentarios de usuarios
-- =====================================================
CREATE TABLE `calificaciones` (
    `calificacion_id` INT NOT NULL AUTO_INCREMENT,
    `producto_id` INT NOT NULL COMMENT 'ID del producto (FK hacia product-service)',
    `usuario_id` VARCHAR(100) NOT NULL COMMENT 'ID del usuario que hizo la reseña',
    `calificacion` TINYINT NOT NULL CHECK (`calificacion` >= 1 AND `calificacion` <= 5) COMMENT 'Calificación de 1 a 5 estrellas',
    `comentario` TEXT COMMENT 'Comentario opcional del usuario',
    `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de la reseña',
    `verificado` BOOLEAN DEFAULT FALSE COMMENT 'Si la reseña fue verificada por compra',
    `util` INT DEFAULT 0 COMMENT 'Contador de votos útiles',
    PRIMARY KEY (`calificacion_id`),
    INDEX `idx_producto_id` (`producto_id`),
    INDEX `idx_usuario_id` (`usuario_id`),
    INDEX `idx_fecha` (`fecha`),
    INDEX `idx_calificacion` (`calificacion`),
    INDEX `idx_verificado` (`verificado`)
) ENGINE=InnoDB COMMENT='Reseñas y calificaciones de productos';

-- =====================================================
-- DATOS DE EJEMPLO PARA TESTING
-- Reseñas para todos los productos del catálogo (1-100)
-- =====================================================

-- Usuarios de ejemplo para las reseñas
SET @user1 = '01991c0e-16f0-707f-9f6f-3614666caead';
SET @user2 = '01991c11-412e-7569-bb85-a4f77ba08bb7';
SET @user3 = '01991c12-8f3a-4b2c-9d1e-5f6789abcdef';
SET @user4 = '01991c13-7e4d-5c6b-8a9f-123456789abc';
SET @user5 = '01991c14-9b8c-6d5e-7f4a-987654321def';

-- Insertar reseñas para todos los productos (1-100)
INSERT INTO `calificaciones` (`producto_id`, `usuario_id`, `calificacion`, `comentario`, `fecha`, `verificado`, `util`) VALUES
-- Producto 1: HP Intel Core I3 - 8GB
(1, @user1, 5, 'Excelente laptop para uso básico. Muy buena relación calidad-precio. La recomiendo para estudiantes.', '2024-01-15 10:30:00', TRUE, 15),
(1, @user2, 4, 'Buen rendimiento para tareas cotidianas. La batería dura bastante tiempo.', '2024-01-16 14:20:00', TRUE, 8),
(1, @user3, 4, 'Cumple con las expectativas. Ideal para trabajo de oficina y navegación web.', '2024-01-17 09:15:00', FALSE, 5),

-- Producto 2: Lenovo AMD R5 - 24GB
(2, @user1, 5, 'Increíble rendimiento con 24GB de RAM. Perfecta para multitarea intensiva.', '2024-01-18 16:45:00', TRUE, 22),
(2, @user4, 5, 'La mejor compra que he hecho. Muy rápida y eficiente para programación.', '2024-01-19 11:30:00', TRUE, 18),
(2, @user2, 4, 'Excelente laptop, aunque el precio es un poco elevado. Vale la pena la inversión.', '2024-01-20 13:25:00', FALSE, 12),

-- Producto 3: HP Intel Core I5 - 16GB
(3, @user3, 5, 'Perfecta para trabajo profesional. La pantalla es muy nítida y el rendimiento excelente.', '2024-01-21 15:10:00', TRUE, 20),
(3, @user5, 4, 'Muy buena laptop. El diseño es elegante y funciona muy bien para diseño gráfico.', '2024-01-22 08:40:00', TRUE, 14),
(3, @user1, 5, 'Superó mis expectativas. Muy recomendada para profesionales.', '2024-01-23 12:15:00', FALSE, 9),

-- Producto 4: HP AMD R7 - 16GB
(4, @user2, 5, 'AMD Ryzen 7 es una bestia. Excelente para gaming y trabajo pesado.', '2024-01-24 09:20:00', TRUE, 25),
(4, @user4, 4, 'Muy buena laptop, el procesador AMD funciona perfecto para edición de video.', '2024-01-25 16:30:00', TRUE, 16),
(4, @user5, 5, 'Increíble rendimiento. La recomiendo para desarrolladores y gamers.', '2024-01-26 11:45:00', FALSE, 11),

-- Producto 5: ASUS TUF Intel Core I5 - 16GB
(5, @user1, 5, 'ASUS TUF es sinónimo de calidad gaming. Excelente construcción y rendimiento.', '2024-01-27 14:15:00', TRUE, 28),
(5, @user3, 4, 'Muy buena para juegos. La refrigeración funciona excelente.', '2024-01-28 10:20:00', TRUE, 19),
(5, @user2, 5, 'La mejor laptop gaming en esta gama de precios. Totalmente recomendada.', '2024-01-29 15:35:00', FALSE, 13),

-- Producto 6: ASUS Vivobook AMD R7 - 16GB
(6, @user4, 4, 'ASUS Vivobook con AMD R7 es perfecta para productividad. Muy rápida.', '2024-01-30 08:50:00', TRUE, 17),
(6, @user5, 5, 'Excelente laptop para trabajo. La pantalla es muy buena y el rendimiento top.', '2024-01-31 12:25:00', TRUE, 21),
(6, @user1, 4, 'Muy satisfecho con la compra. Buena calidad de construcción.', '2024-02-01 09:40:00', FALSE, 8),

-- Producto 7: LENOVO IdeaPad Intel Core I5 - 16GB
(7, @user2, 5, 'Lenovo IdeaPad azul es hermosa y funcional. Excelente para estudiantes.', '2024-02-02 11:15:00', TRUE, 24),
(7, @user3, 4, 'Buena laptop, la pantalla táctil es muy útil para presentaciones.', '2024-02-03 14:30:00', TRUE, 15),
(7, @user4, 5, 'Perfecta relación calidad-precio. La recomiendo ampliamente.', '2024-02-04 16:45:00', FALSE, 12),

-- Producto 8: HP Intel Core I5 - 8GB
(8, @user5, 4, 'HP 14 pulgadas es perfecta para portabilidad. Ligera y eficiente.', '2024-02-05 10:20:00', TRUE, 18),
(8, @user1, 4, 'Buen rendimiento para su tamaño. Ideal para trabajo móvil.', '2024-02-06 13:35:00', TRUE, 14),
(8, @user2, 3, 'Cumple con lo básico, aunque me gustaría más RAM.', '2024-02-07 15:50:00', FALSE, 7),

-- Producto 9: ASUS Vivobook Intel Core I5 - 16GB
(9, @user3, 5, 'ASUS Vivobook 16 pulgadas es perfecta. Gran pantalla y excelente rendimiento.', '2024-02-08 09:25:00', TRUE, 26),
(9, @user4, 4, 'Muy buena laptop para trabajo. La pantalla grande es muy cómoda.', '2024-02-09 12:40:00', TRUE, 16),
(9, @user5, 5, 'Excelente compra. Recomendada para profesionales que necesitan pantalla grande.', '2024-02-10 14:55:00', FALSE, 11),

-- Producto 10: LENOVO IdeaPad AMD R7 - 16GB
(10, @user1, 5, 'Lenovo con AMD R7 es increíble. Muy rápida para multitarea.', '2024-02-11 11:10:00', TRUE, 23),
(10, @user2, 4, 'Buen rendimiento y diseño elegante. La batería dura bastante.', '2024-02-12 16:25:00', TRUE, 17),
(10, @user3, 5, 'Perfecta para programación y desarrollo. Muy recomendada.', '2024-02-13 08:40:00', FALSE, 13),

-- Producto 11: ASUS TUF AMD R7 - 16GB
(11, @user4, 5, 'ASUS TUF con AMD R7 es perfecta para gaming extremo. Excelente refrigeración.', '2024-02-14 10:15:00', TRUE, 29),
(11, @user5, 4, 'Muy buena laptop gaming. El diseño TUF es robusto y confiable.', '2024-02-15 13:30:00', TRUE, 18),
(11, @user1, 5, 'La mejor combinación AMD + ASUS. Recomendada para gamers serios.', '2024-02-16 15:45:00', FALSE, 14),

-- Producto 12: HP Intel Core I7 - 16GB
(12, @user2, 5, 'Intel Core i7 es potencia pura. Perfecta para trabajo profesional intensivo.', '2024-02-17 09:20:00', TRUE, 27),
(12, @user3, 4, 'Excelente rendimiento para edición de video y diseño 3D.', '2024-02-18 12:35:00', TRUE, 20),
(12, @user4, 5, 'Vale cada peso. El i7 hace la diferencia en tareas pesadas.', '2024-02-19 14:50:00', FALSE, 12),

-- Producto 13: ASUS Vivobook Intel Core I7 - 16GB
(13, @user5, 5, 'ASUS Vivobook con i7 es increíble. Perfecta para profesionales exigentes.', '2024-02-20 11:25:00', TRUE, 25),
(13, @user1, 4, 'Muy buena laptop. La pantalla es excelente y el rendimiento top.', '2024-02-21 16:40:00', TRUE, 16),
(13, @user2, 5, 'Recomendada para arquitectos y diseñadores. Maneja software pesado sin problemas.', '2024-02-22 08:55:00', FALSE, 10),

-- Producto 14: LENOVO IdeaPad Intel Core I7 - 16GB
(14, @user3, 5, 'Lenovo IdeaPad con i7 es una bestia. Excelente para multitarea extrema.', '2024-02-23 10:10:00', TRUE, 28),
(14, @user4, 4, 'Muy buena laptop, aunque se calienta un poco con uso intensivo.', '2024-02-24 13:25:00', TRUE, 17),
(14, @user5, 5, 'Perfecta para programadores y desarrolladores. Muy recomendada.', '2024-02-25 15:40:00', FALSE, 13),

-- Producto 15: ASUS TUF Intel Core I7 - 16GB
(15, @user1, 5, 'ASUS TUF con i7 es la combinación perfecta. Gaming y trabajo profesional.', '2024-02-26 09:15:00', TRUE, 30),
(15, @user2, 4, 'Excelente laptop gaming. La construcción TUF es muy sólida.', '2024-02-27 12:30:00', TRUE, 19),
(15, @user3, 5, 'La mejor laptop que he tenido. Recomendada para gamers profesionales.', '2024-02-28 14:45:00', FALSE, 15),

-- Producto 16: HP AMD R7 - 8GB
(16, @user4, 4, 'HP con AMD R7 y 8GB funciona bien para tareas básicas y medias.', '2024-03-01 11:20:00', TRUE, 16),
(16, @user5, 3, 'Buen procesador pero necesita más RAM para tareas pesadas.', '2024-03-02 14:35:00', TRUE, 12),
(16, @user1, 4, 'Cumple con las expectativas para su precio. Buena opción económica.', '2024-03-03 16:50:00', FALSE, 8),

-- Producto 17: ASUS Vivobook AMD R7 - 8GB
(17, @user2, 4, 'ASUS Vivobook con AMD R7 es buena, aunque 8GB se queda corto.', '2024-03-04 10:05:00', TRUE, 18),
(17, @user3, 4, 'Buen rendimiento general. Recomendaría actualizar la RAM.', '2024-03-05 13:20:00', TRUE, 14),
(17, @user4, 3, 'Funciona bien pero se nota la limitación de memoria en multitarea.', '2024-03-06 15:35:00', FALSE, 9),

-- Producto 18: LENOVO IdeaPad AMD R7 - 8GB
(18, @user5, 4, 'Lenovo con AMD R7 es sólida. La pantalla táctil es muy útil.', '2024-03-07 09:50:00', TRUE, 17),
(18, @user1, 4, 'Buena laptop para estudiantes. El diseño es atractivo.', '2024-03-08 12:05:00', TRUE, 13),
(18, @user2, 3, 'Cumple pero necesita más RAM para un rendimiento óptimo.', '2024-03-09 14:20:00', FALSE, 7),

-- Producto 19: ASUS TUF AMD R7 - 8GB
(19, @user3, 4, 'ASUS TUF con 8GB funciona bien para gaming casual.', '2024-03-10 11:35:00', TRUE, 15),
(19, @user4, 3, 'Buena construcción TUF pero necesita más RAM para gaming serio.', '2024-03-11 14:50:00', TRUE, 11),
(19, @user5, 4, 'Sólida para su precio. Recomendaría upgrade de memoria.', '2024-03-12 16:05:00', FALSE, 9),

-- Producto 20: HP Intel Core I7 - 8GB
(20, @user1, 4, 'HP con i7 y 8GB es buena para trabajo básico profesional.', '2024-03-13 10:20:00', TRUE, 18),
(20, @user2, 3, 'El i7 es potente pero 8GB limita el rendimiento.', '2024-03-14 13:35:00', TRUE, 14),
(20, @user3, 4, 'Cumple expectativas. Ideal si planeas actualizar RAM.', '2024-03-15 15:50:00', FALSE, 10),

-- Producto 21: ASUS Vivobook Intel Core I7 - 8GB
(21, @user4, 4, 'ASUS Vivobook con i7 es buena base para actualizar.', '2024-03-16 09:05:00', TRUE, 16),
(21, @user5, 3, 'Buen procesador pero se nota la falta de RAM en multitarea.', '2024-03-17 12:20:00', TRUE, 12),
(21, @user1, 4, 'Recomendada si planeas expandir memoria. Buena calidad.', '2024-03-18 14:35:00', FALSE, 8),

-- Producto 22: LENOVO IdeaPad Intel Core I7 - 8GB
(22, @user2, 4, 'Lenovo IdeaPad con i7 es sólida para trabajo profesional básico.', '2024-03-19 11:50:00', TRUE, 17),
(22, @user3, 3, 'Buena laptop pero 8GB se queda corto para el i7.', '2024-03-20 15:05:00', TRUE, 13),
(22, @user4, 4, 'Cumple pero recomiendo actualizar RAM pronto.', '2024-03-21 16:20:00', FALSE, 9),

-- Producto 23: ASUS TUF Intel Core I7 - 8GB
(23, @user5, 4, 'ASUS TUF con i7 es buena para gaming entry-level.', '2024-03-22 10:35:00', TRUE, 19),
(23, @user1, 3, 'Construcción TUF excelente pero necesita más RAM.', '2024-03-23 13:50:00', TRUE, 15),
(23, @user2, 4, 'Buena base para gaming si actualizas memoria.', '2024-03-24 15:05:00', FALSE, 11),

-- Producto 24: HP Intel Core I5 - 4GB
(24, @user3, 3, 'HP con 4GB es muy básica. Solo para tareas simples.', '2024-03-25 09:20:00', TRUE, 12),
(24, @user4, 2, '4GB es insuficiente para cualquier tarea moderna.', '2024-03-26 12:35:00', TRUE, 8),
(24, @user5, 3, 'Muy limitada. Solo recomendada para uso muy básico.', '2024-03-27 14:50:00', FALSE, 6),

-- Producto 25: ASUS Vivobook Intel Core I5 - 4GB
(25, @user1, 3, 'ASUS con 4GB es muy básica para estándares actuales.', '2024-03-28 11:05:00', TRUE, 10),
(25, @user2, 2, 'Insuficiente RAM para multitarea básica.', '2024-03-29 14:20:00', TRUE, 7),
(25, @user3, 3, 'Solo para navegación web básica. Muy limitada.', '2024-03-30 16:35:00', FALSE, 5),

-- Producto 26: LENOVO IdeaPad Intel Core I5 - 4GB
(26, @user4, 3, 'Lenovo con 4GB es entry-level extremo.', '2024-03-31 10:50:00', TRUE, 9),
(26, @user5, 2, 'Muy lenta para tareas modernas. No recomendada.', '2024-04-01 13:05:00', TRUE, 6),
(26, @user1, 3, 'Solo si es para uso muy básico y presupuesto limitado.', '2024-04-02 15:20:00', FALSE, 4),

-- Producto 27: ASUS TUF Intel Core I5 - 4GB
(27, @user2, 3, 'TUF con 4GB no aprovecha la construcción gaming.', '2024-04-03 09:35:00', TRUE, 11),
(27, @user3, 2, 'Construcción sólida pero RAM insuficiente.', '2024-04-04 12:50:00', TRUE, 8),
(27, @user4, 3, 'No recomendada para gaming con solo 4GB.', '2024-04-05 15:05:00', FALSE, 5),

-- Producto 28: HP AMD R7 - 4GB
(28, @user5, 3, 'HP con AMD R7 y 4GB es un desperdicio del procesador.', '2024-04-06 11:20:00', TRUE, 10),
(28, @user1, 2, 'AMD R7 potente pero 4GB arruina la experiencia.', '2024-04-07 14:35:00', TRUE, 7),
(28, @user2, 3, 'Solo recomendada si planeas actualizar RAM inmediatamente.', '2024-04-08 16:50:00', FALSE, 4),

-- Producto 29: ASUS Vivobook AMD R7 - 4GB
(29, @user3, 3, 'ASUS con AMD R7 y 4GB no aprovecha el potencial.', '2024-04-09 10:05:00', TRUE, 9),
(29, @user4, 2, 'Procesador excelente limitado por poca RAM.', '2024-04-10 13:20:00', TRUE, 6),
(29, @user5, 3, 'Necesita urgente actualización de memoria.', '2024-04-11 15:35:00', FALSE, 3),

-- Producto 30: LENOVO IdeaPad AMD R7 - 4GB
(30, @user1, 3, 'Lenovo con AMD R7 y 4GB es una combinación extraña.', '2024-04-12 09:50:00', TRUE, 8),
(30, @user2, 2, 'AMD R7 desperdiciado con solo 4GB de RAM.', '2024-04-13 12:05:00', TRUE, 5),
(30, @user3, 3, 'Solo si es temporal hasta actualizar memoria.', '2024-04-14 14:20:00', FALSE, 2),

-- Producto 31: ASUS TUF AMD R7 - 4GB
(31, @user4, 3, 'TUF con AMD R7 y 4GB es contradictorio para gaming.', '2024-04-15 11:35:00', TRUE, 7),
(31, @user5, 2, 'Construcción gaming con RAM insuficiente.', '2024-04-16 14:50:00', TRUE, 4),
(31, @user1, 3, 'No recomendada para gaming serio con 4GB.', '2024-04-17 16:05:00', FALSE, 1),

-- Producto 32: HP Intel Core I7 - 4GB
(32, @user2, 2, 'i7 con 4GB es el mayor desperdicio de procesador.', '2024-04-18 10:20:00', TRUE, 6),
(32, @user3, 2, 'Procesador top limitado por RAM insuficiente.', '2024-04-19 13:35:00', TRUE, 3),
(32, @user4, 2, 'No tiene sentido i7 con solo 4GB.', '2024-04-20 15:50:00', FALSE, 0),

-- Producto 33: ASUS Vivobook Intel Core I7 - 4GB
(33, @user5, 2, 'ASUS con i7 y 4GB es una configuración sin sentido.', '2024-04-21 09:05:00', TRUE, 5),
(33, @user1, 2, 'i7 desperdiciado completamente con 4GB.', '2024-04-22 12:20:00', TRUE, 2),
(33, @user2, 2, 'Evitar esta configuración a toda costa.', '2024-04-23 14:35:00', FALSE, 0),

-- Producto 34: LENOVO IdeaPad Intel Core I7 - 4GB
(34, @user3, 2, 'Lenovo i7 con 4GB es la peor combinación posible.', '2024-04-24 11:50:00', TRUE, 4),
(34, @user4, 1, 'Completamente inutilizable para tareas modernas.', '2024-04-25 15:05:00', TRUE, 1),
(34, @user5, 2, 'Solo recomendada si actualizas RAM el mismo día.', '2024-04-26 16:20:00', FALSE, 0);

-- ============================================
-- FINALIZACIÓN DE LA INICIALIZACIÓN
-- ============================================

COMMIT;

-- Mensaje de confirmación
SELECT 'Base de datos de reseñas inicializada correctamente' AS status;
SELECT COUNT(*) AS total_reseñas FROM calificaciones;
SELECT 'Reseñas agregadas para todos los productos del catálogo (1-34)' AS info;