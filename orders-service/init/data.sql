-- =====================================================
-- SCRIPT DE INICIALIZACIÓN - ORDERS SERVICE
-- Base de datos para gestión de órdenes - ByteStore
-- =====================================================

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS orders_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE orders_db;

-- =====================================================
-- TABLA: orders (órdenes)
-- Almacena la información principal de cada orden
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    orden_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL COMMENT 'ID del usuario que realizó la orden',
    correo_usuario VARCHAR(300) NOT NULL COMMENT 'Email del usuario',
    direccion TEXT NOT NULL COMMENT 'Dirección de entrega',
    nombre_completo VARCHAR(200) NOT NULL COMMENT 'Nombre completo del cliente',
    estado ENUM('pendiente', 'procesando', 'enviado', 'entregado', 'cancelado') DEFAULT 'pendiente' COMMENT 'Estado actual de la orden',
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Total de la orden',
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del pago',
    fecha_entrega TIMESTAMP NULL COMMENT 'Fecha estimada/real de entrega',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para optimizar consultas
    INDEX idx_user_id (user_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha_pago (fecha_pago),
    INDEX idx_correo_usuario (correo_usuario)
) ENGINE=InnoDB COMMENT='Tabla principal de órdenes';

-- =====================================================
-- TABLA: order_products (productos de la orden)
-- Almacena los productos incluidos en cada orden
-- =====================================================
CREATE TABLE IF NOT EXISTS order_products (
    orden_productos_id INT AUTO_INCREMENT PRIMARY KEY,
    orden_id INT NOT NULL COMMENT 'ID de la orden (FK)',
    producto_id INT NOT NULL COMMENT 'ID del producto',
    nombre VARCHAR(300) NOT NULL COMMENT 'Nombre del producto al momento de la compra',
    precio DECIMAL(10,2) NOT NULL COMMENT 'Precio del producto al momento de la compra',
    descuento DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Descuento aplicado (porcentaje)',
    marca VARCHAR(100) NOT NULL COMMENT 'Marca del producto',
    modelo VARCHAR(100) NOT NULL COMMENT 'Modelo del producto',
    cantidad INT NOT NULL DEFAULT 1 COMMENT 'Cantidad del producto en la orden',
    imagen TEXT COMMENT 'URL de la imagen del producto',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Claves foráneas
    FOREIGN KEY (orden_id) REFERENCES orders(orden_id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Índices para optimizar consultas
    INDEX idx_orden_id (orden_id),
    INDEX idx_producto_id (producto_id),
    INDEX idx_marca (marca),
    
    -- Restricciones
    CONSTRAINT chk_cantidad_positiva CHECK (cantidad > 0),
    CONSTRAINT chk_precio_positivo CHECK (precio >= 0),
    CONSTRAINT chk_descuento_valido CHECK (descuento >= 0 AND descuento <= 100)
) ENGINE=InnoDB COMMENT='Productos incluidos en cada orden';

-- =====================================================
-- TABLA: order_status_history (historial de estados)
-- Almacena el historial de cambios de estado de órdenes
-- =====================================================
CREATE TABLE IF NOT EXISTS order_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orden_id INT NOT NULL COMMENT 'ID de la orden (FK)',
    estado_anterior ENUM('pendiente', 'procesando', 'enviado', 'entregado', 'cancelado') NOT NULL COMMENT 'Estado anterior de la orden',
    estado_nuevo ENUM('pendiente', 'procesando', 'enviado', 'entregado', 'cancelado') NOT NULL COMMENT 'Nuevo estado de la orden',
    motivo TEXT COMMENT 'Motivo del cambio de estado',
    changed_by INT NOT NULL COMMENT 'ID del usuario que realizó el cambio',
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del cambio',
    
    -- Claves foráneas
    FOREIGN KEY (orden_id) REFERENCES orders(orden_id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Índices para optimizar consultas
    INDEX idx_orden_historial (orden_id),
    INDEX idx_fecha_cambio (changed_at),
    INDEX idx_estado_anterior (estado_anterior),
    INDEX idx_estado_nuevo (estado_nuevo)
) ENGINE=InnoDB COMMENT='Historial de cambios de estado de órdenes';

-- =====================================================
-- DATOS DE EJEMPLO PARA TESTING
-- =====================================================

-- ============================================
-- DATOS DE EJEMPLO PARA ÓRDENES
-- ============================================
-- Órdenes con productos reales del catálogo ByteStore
-- IDs de productos consistentes con product-service

INSERT INTO orders (user_id, correo_usuario, direccion, nombre_completo, estado, total, fecha_entrega) VALUES
-- Orden 1: Cliente compra laptop gaming de alta gama
('user_001', 'juan.perez@email.com', 'Calle 123 #45-67, Bogotá, Colombia', 'Juan Pérez García', 'entregado', 4200000.00, '2024-01-15 14:30:00'),
-- Orden 2: Cliente compra laptop para trabajo profesional
('user_002', 'maria.rodriguez@email.com', 'Carrera 15 #28-45, Medellín, Colombia', 'María Rodríguez López', 'enviado', 3800000.00, '2024-01-20 10:00:00'),
-- Orden 3: Cliente compra múltiples laptops para oficina
('user_003', 'carlos.martinez@email.com', 'Avenida 68 #125-30, Cali, Colombia', 'Carlos Martínez Silva', 'procesando', 6400000.00, NULL),
-- Orden 4: Cliente compra laptop básica
('user_001', 'juan.perez@email.com', 'Calle 123 #45-67, Bogotá, Colombia', 'Juan Pérez García', 'pendiente', 1500000.00, NULL),
-- Orden 5: Cliente compra laptops gaming para equipo
('user_004', 'ana.gonzalez@email.com', 'Calle 50 #12-34, Barranquilla, Colombia', 'Ana González Ruiz', 'entregado', 8400000.00, '2024-01-22 16:00:00'),
-- Orden 6: Cliente compra laptop para estudiante
('user_005', 'luis.garcia@email.com', 'Carrera 7 #85-20, Bogotá, Colombia', 'Luis García Moreno', 'entregado', 2200000.00, '2024-01-18 16:30:00'),
-- Orden 7: Cliente compra laptop profesional HP
('user_006', 'sofia.herrera@email.com', 'Calle 10 #5-25, Cartagena, Colombia', 'Sofía Herrera Castro', 'enviado', 3200000.00, '2024-01-25 12:00:00');

-- ============================================
-- PRODUCTOS EN ÓRDENES CON IDS REALES
-- ============================================
-- Usando IDs de productos reales del catálogo (1-34)

INSERT INTO order_products (orden_id, producto_id, nombre, precio, descuento, marca, modelo, cantidad, imagen) VALUES
-- Orden 1: ASUS TUF Gaming (productos premium)
(1, 15, 'ASUS TUF Gaming Intel Core I7 - 16GB RAM - 512GB SSD', 4200000.00, 0.00, 'ASUS', 'TUF Gaming F15', 1, 'https://bytestore.com/images/asus-tuf-gaming-i7.jpg'),

-- Orden 2: Laptop profesional HP
(2, 12, 'HP Pavilion Intel Core I7 - 16GB RAM - 1TB SSD', 3800000.00, 0.00, 'HP', 'Pavilion 15', 1, 'https://bytestore.com/images/hp-pavilion-i7.jpg'),

-- Orden 3: Múltiples laptops para oficina
(3, 9, 'ASUS Vivobook Intel Core I5 - 16GB RAM - 512GB SSD', 3200000.00, 0.00, 'ASUS', 'Vivobook 15', 2, 'https://bytestore.com/images/asus-vivobook-i5.jpg'),

-- Orden 4: Laptop básica
(4, 8, 'HP Laptop Intel Core I5 - 8GB RAM - 256GB SSD', 1500000.00, 0.00, 'HP', 'Laptop 15', 1, 'https://bytestore.com/images/hp-laptop-i5.jpg'),

-- Orden 5: Gaming setup para equipo
(5, 11, 'ASUS TUF Gaming AMD Ryzen 7 - 16GB RAM - 512GB SSD', 4200000.00, 0.00, 'ASUS', 'TUF Gaming A15', 2, 'https://bytestore.com/images/asus-tuf-amd-r7.jpg'),

-- Orden 6: Laptop para estudiante
(6, 7, 'LENOVO IdeaPad Intel Core I5 - 16GB RAM - 512GB SSD', 2200000.00, 0.00, 'LENOVO', 'IdeaPad 3', 1, 'https://bytestore.com/images/lenovo-ideapad-i5.jpg'),

-- Orden 7: Laptop profesional HP
(7, 3, 'HP ProBook Intel Core I5 - 16GB RAM - 512GB SSD', 3200000.00, 0.00, 'HP', 'ProBook 450 G9', 1, 'https://bytestore.com/images/hp-probook-i5.jpg');

-- =====================================================
-- VISTAS ÚTILES PARA CONSULTAS
-- =====================================================

-- Vista para órdenes con información resumida
CREATE OR REPLACE VIEW orders_summary AS
SELECT 
    o.orden_id,
    o.user_id,
    o.correo_usuario,
    o.nombre_completo,
    o.estado,
    o.total,
    o.fecha_pago,
    o.fecha_entrega,
    COUNT(op.orden_productos_id) as total_productos,
    SUM(op.cantidad) as total_items
FROM orders o
LEFT JOIN order_products op ON o.orden_id = op.orden_id
GROUP BY o.orden_id;

-- Vista para productos más vendidos
CREATE OR REPLACE VIEW productos_mas_vendidos AS
SELECT 
    op.producto_id,
    op.nombre,
    op.marca,
    op.modelo,
    COUNT(*) as veces_ordenado,
    SUM(op.cantidad) as total_vendido,
    AVG(op.precio) as precio_promedio
FROM order_products op
JOIN orders o ON op.orden_id = o.orden_id
WHERE o.estado IN ('procesando', 'enviado', 'entregado')
GROUP BY op.producto_id, op.nombre, op.marca, op.modelo
ORDER BY total_vendido DESC;

-- =====================================================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- =====================================================

-- Procedimiento para calcular el total de una orden
DELIMITER //
CREATE PROCEDURE CalcularTotalOrden(IN orden_id_param INT)
BEGIN
    DECLARE total_calculado DECIMAL(10,2) DEFAULT 0.00;
    
    -- Calcular total basado en productos
    SELECT SUM(precio * cantidad * (1 - descuento/100)) INTO total_calculado
    FROM order_products 
    WHERE orden_id = orden_id_param;
    
    -- Actualizar el total en la orden
    UPDATE orders 
    SET total = COALESCE(total_calculado, 0.00)
    WHERE orden_id = orden_id_param;
END //
DELIMITER ;

-- =====================================================
-- TRIGGERS PARA MANTENER CONSISTENCIA
-- =====================================================

-- Trigger para recalcular total cuando se modifica un producto
DELIMITER //
CREATE TRIGGER recalcular_total_orden
AFTER INSERT ON order_products
FOR EACH ROW
BEGIN
    CALL CalcularTotalOrden(NEW.orden_id);
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER recalcular_total_orden_update
AFTER UPDATE ON order_products
FOR EACH ROW
BEGIN
    CALL CalcularTotalOrden(NEW.orden_id);
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER recalcular_total_orden_delete
AFTER DELETE ON order_products
FOR EACH ROW
BEGIN
    CALL CalcularTotalOrden(OLD.orden_id);
END //
DELIMITER ;

-- =====================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice compuesto para consultas de órdenes por usuario y estado
CREATE INDEX idx_user_estado ON orders(user_id, estado);

-- Índice para consultas por rango de fechas
CREATE INDEX idx_fecha_pago_estado ON orders(fecha_pago, estado);

-- Índice para búsquedas de productos por marca y modelo
CREATE INDEX idx_marca_modelo ON order_products(marca, modelo);

COMMIT;

-- =====================================================
-- INFORMACIÓN DE INICIALIZACIÓN COMPLETADA
-- =====================================================
SELECT 'Base de datos orders_db inicializada correctamente' AS status;
SELECT COUNT(*) AS total_ordenes FROM orders;
SELECT COUNT(*) AS total_productos_ordenados FROM order_products;