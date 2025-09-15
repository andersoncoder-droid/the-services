import { db } from '../db.js';
import { createOrderSchema, updateOrderSchema, orderIdSchema, ordersQuerySchema, } from '../schemas/order.schema.js';
// Crear una nueva orden
export async function createOrder(req, res) {
    try {
        // Validar datos de entrada
        const validatedData = createOrderSchema.parse(req.body);
        const usuario_id = req.auth.id;
        const isAdmin = req.auth.role === 'ADMINISTRADOR';
        // Verificar que el usuario puede crear la orden (debe ser el mismo usuario o admin)
        if (!isAdmin && validatedData.user_id !== usuario_id) {
            return res.status(403).json({
                message: 'No tienes permisos para crear una orden para otro usuario',
            });
        }
        // Iniciar transacción
        await db.query('START TRANSACTION');
        try {
            // Calcular el total de la orden
            let total = 0;
            const productDetails = [];
            // Obtener detalles de cada producto (simulado - en un entorno real consultaríamos el servicio de productos)
            for (const producto of validatedData.productos) {
                // Por ahora, usamos precios simulados
                const precio = 1000000; // Precio base simulado
                const descuento = 0;
                const subtotal = precio * producto.cantidad * (1 - descuento / 100);
                total += subtotal;
                productDetails.push({
                    producto_id: producto.producto_id,
                    cantidad: producto.cantidad,
                    precio,
                    descuento,
                    nombre: `Producto ${producto.producto_id}`,
                    marca: 'Marca Simulada',
                    modelo: `Modelo-${producto.producto_id}`,
                    imagen: 'imagen-simulada.jpg',
                });
            }
            // Crear la orden
            const [orderResult] = await db.query(`INSERT INTO ordenes (user_id, correo_usuario, direccion, nombre_completo, estado, total, fecha_pago) 
         VALUES (?, ?, ?, ?, 'pendiente', ?, NOW())`, [
                validatedData.user_id,
                validatedData.correo_usuario,
                validatedData.direccion,
                validatedData.nombre_completo,
                total,
            ]);
            const ordenId = orderResult.insertId;
            // Insertar productos de la orden
            for (const product of productDetails) {
                await db.query(`INSERT INTO orden_productos (orden_id, producto_id, nombre, precio, descuento, marca, modelo, cantidad, imagen)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    ordenId,
                    product.producto_id,
                    product.nombre,
                    product.precio,
                    product.descuento,
                    product.marca,
                    product.modelo,
                    product.cantidad,
                    product.imagen,
                ]);
            }
            // Confirmar transacción
            await db.query('COMMIT');
            // Obtener la orden creada con sus productos
            const [newOrder] = await db.query(`SELECT 
          orden_id,
          user_id,
          correo_usuario,
          direccion,
          nombre_completo,
          estado,
          total,
          DATE_FORMAT(fecha_pago, '%Y-%m-%dT%H:%i:%s.000Z') as fecha_pago,
          DATE_FORMAT(fecha_entrega, '%Y-%m-%dT%H:%i:%s.000Z') as fecha_entrega
        FROM ordenes WHERE orden_id = ?`, [ordenId]);
            const [orderProducts] = await db.query('SELECT * FROM orden_productos WHERE orden_id = ?', [ordenId]);
            const response = {
                ...newOrder[0],
                productos: orderProducts,
            };
            res.status(201).json({
                message: 'Orden creada exitosamente',
                data: response,
            });
        }
        catch (error) {
            // Revertir transacción en caso de error
            await db.query('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                message: 'Datos de entrada inválidos',
                errors: error.errors,
            });
        }
        console.error('Error al crear orden:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}
// Obtener órdenes con paginación y filtros
export async function getOrders(req, res) {
    try {
        // Validar parámetros de consulta
        const validatedQuery = ordersQuerySchema.parse(req.query);
        const { page, limit, user_id, estado, fecha_desde, fecha_hasta, sort, order, } = validatedQuery;
        const usuario_id = req.auth.id;
        const isAdmin = req.auth.role === 'ADMINISTRADOR';
        // Construir la consulta base
        let baseQuery = `
      SELECT 
        orden_id,
        user_id,
        correo_usuario,
        direccion,
        nombre_completo,
        estado,
        total,
        DATE_FORMAT(fecha_pago, '%Y-%m-%dT%H:%i:%s.000Z') as fecha_pago,
        DATE_FORMAT(fecha_entrega, '%Y-%m-%dT%H:%i:%s.000Z') as fecha_entrega
      FROM ordenes
      WHERE 1=1
    `;
        let countQuery = 'SELECT COUNT(*) as total FROM ordenes WHERE 1=1';
        const queryParams = [];
        // Si no es admin, solo puede ver sus propias órdenes
        if (!isAdmin) {
            baseQuery += ' AND user_id = ?';
            countQuery += ' AND user_id = ?';
            queryParams.push(usuario_id);
        }
        // Aplicar filtros
        if (user_id && isAdmin) {
            baseQuery += ' AND user_id = ?';
            countQuery += ' AND user_id = ?';
            queryParams.push(user_id);
        }
        if (estado) {
            baseQuery += ' AND estado = ?';
            countQuery += ' AND estado = ?';
            queryParams.push(estado);
        }
        if (fecha_desde) {
            baseQuery += ' AND fecha_pago >= ?';
            countQuery += ' AND fecha_pago >= ?';
            queryParams.push(fecha_desde);
        }
        if (fecha_hasta) {
            baseQuery += ' AND fecha_pago <= ?';
            countQuery += ' AND fecha_pago <= ?';
            queryParams.push(fecha_hasta);
        }
        // Aplicar ordenamiento
        if (sort === 'fecha_pago') {
            baseQuery += ` ORDER BY fecha_pago ${order}`;
        }
        else if (sort === 'total') {
            baseQuery += ` ORDER BY total ${order}`;
        }
        else if (sort === 'estado') {
            baseQuery += ` ORDER BY estado ${order}`;
        }
        // Obtener total de registros
        const [totalResult] = await db.query(countQuery, queryParams);
        const total = totalResult[0].total;
        // Calcular paginación
        const pages = Math.ceil(total / limit);
        const currentPage = Math.max(1, Math.min(page, pages));
        const offset = (currentPage - 1) * limit;
        const first = 1;
        const prev = currentPage > 1 ? currentPage - 1 : null;
        const next = currentPage < pages ? currentPage + 1 : null;
        // Aplicar paginación
        baseQuery += ' LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);
        // Ejecutar consulta
        const [orders] = await db.query(baseQuery, queryParams);
        // Obtener productos para cada orden
        const ordersWithProducts = [];
        for (const order of orders) {
            const [products] = await db.query('SELECT * FROM orden_productos WHERE orden_id = ?', [order.orden_id]);
            ordersWithProducts.push({
                ...order,
                productos: products,
            });
        }
        const response = {
            total,
            pages,
            first,
            next,
            prev,
            data: ordersWithProducts,
        };
        res.status(200).json(response);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                message: 'Parámetros de consulta inválidos',
                errors: error.errors,
            });
        }
        console.error('Error al obtener órdenes:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}
// Obtener orden por ID
export async function getOrderById(req, res) {
    try {
        // Validar parámetro ID
        const { id } = orderIdSchema.parse(req.params);
        const usuario_id = req.auth.id;
        const isAdmin = req.auth.role === 'ADMINISTRADOR';
        // Buscar la orden
        const [order] = await db.query(`SELECT 
        orden_id,
        user_id,
        correo_usuario,
        direccion,
        nombre_completo,
        estado,
        total,
        DATE_FORMAT(fecha_pago, '%Y-%m-%dT%H:%i:%s.000Z') as fecha_pago,
        DATE_FORMAT(fecha_entrega, '%Y-%m-%dT%H:%i:%s.000Z') as fecha_entrega
      FROM ordenes WHERE orden_id = ?`, [id]);
        if (order.length === 0) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }
        // Verificar permisos (propietario o admin)
        if (!isAdmin && order[0].user_id !== usuario_id) {
            return res.status(403).json({
                message: 'No tienes permisos para ver esta orden',
            });
        }
        // Obtener productos de la orden
        const [products] = await db.query('SELECT * FROM orden_productos WHERE orden_id = ?', [id]);
        const response = {
            ...order[0],
            productos: products,
        };
        res.status(200).json({ data: response });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                message: 'ID inválido',
                errors: error.errors,
            });
        }
        console.error('Error al obtener orden:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}
// Actualizar orden
export async function updateOrder(req, res) {
    try {
        // Validar parámetro ID y datos
        const { id } = orderIdSchema.parse(req.params);
        const validatedData = updateOrderSchema.parse(req.body);
        const usuario_id = req.auth.id;
        const isAdmin = req.auth.role === 'ADMINISTRADOR';
        // Verificar que la orden existe
        const [existingOrder] = await db.query('SELECT user_id, estado FROM ordenes WHERE orden_id = ?', [id]);
        if (existingOrder.length === 0) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }
        // Verificar permisos
        const canUpdateStatus = isAdmin;
        const canUpdateAddress = isAdmin || existingOrder[0].user_id === usuario_id;
        if (validatedData.estado && !canUpdateStatus) {
            return res.status(403).json({
                message: 'Solo los administradores pueden cambiar el estado de la orden',
            });
        }
        if (validatedData.direccion && !canUpdateAddress) {
            return res.status(403).json({
                message: 'No tienes permisos para actualizar esta orden',
            });
        }
        // Construir consulta de actualización
        const updateFields = [];
        const updateValues = [];
        if (validatedData.estado !== undefined) {
            updateFields.push('estado = ?');
            updateValues.push(validatedData.estado);
        }
        if (validatedData.direccion !== undefined) {
            updateFields.push('direccion = ?');
            updateValues.push(validatedData.direccion);
        }
        if (validatedData.fecha_entrega !== undefined) {
            updateFields.push('fecha_entrega = ?');
            updateValues.push(validatedData.fecha_entrega);
        }
        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No hay campos para actualizar' });
        }
        updateValues.push(id);
        // Actualizar la orden
        await db.query(`UPDATE ordenes SET ${updateFields.join(', ')} WHERE orden_id = ?`, updateValues);
        // Obtener la orden actualizada
        const [updatedOrder] = await db.query(`SELECT 
        orden_id,
        user_id,
        correo_usuario,
        direccion,
        nombre_completo,
        estado,
        total,
        DATE_FORMAT(fecha_pago, '%Y-%m-%dT%H:%i:%s.000Z') as fecha_pago,
        DATE_FORMAT(fecha_entrega, '%Y-%m-%dT%H:%i:%s.000Z') as fecha_entrega
      FROM ordenes WHERE orden_id = ?`, [id]);
        const [products] = await db.query('SELECT * FROM orden_productos WHERE orden_id = ?', [id]);
        const response = {
            ...updatedOrder[0],
            productos: products,
        };
        res.status(200).json({
            message: 'Orden actualizada exitosamente',
            data: response,
        });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: error.errors,
            });
        }
        console.error('Error al actualizar orden:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}
// Eliminar orden
export async function deleteOrder(req, res) {
    try {
        // Validar parámetro ID
        const { id } = orderIdSchema.parse(req.params);
        const usuario_id = req.auth.id;
        const isAdmin = req.auth.role === 'ADMINISTRADOR';
        // Verificar que la orden existe
        const [existingOrder] = await db.query('SELECT user_id, estado FROM ordenes WHERE orden_id = ?', [id]);
        if (existingOrder.length === 0) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }
        // Solo admins pueden eliminar órdenes
        if (!isAdmin) {
            return res.status(403).json({
                message: 'Solo los administradores pueden eliminar órdenes',
            });
        }
        // Eliminar la orden (los productos se eliminan automáticamente por CASCADE)
        await db.query('DELETE FROM ordenes WHERE orden_id = ?', [id]);
        res.status(200).json({ message: 'Orden eliminada exitosamente' });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                message: 'ID inválido',
                errors: error.errors,
            });
        }
        console.error('Error al eliminar orden:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}
//# sourceMappingURL=orders.controller.js.map