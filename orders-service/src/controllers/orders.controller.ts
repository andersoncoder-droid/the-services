import type { Request, Response } from 'express';
import { db } from '../db.js';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type {
  Order,
  OrderProduct,
  OrderResponseDTO,
  OrdersPaginatedResponse,
} from '../types/order.js';
import {
  createOrderSchema,
  updateOrderSchema,
  orderIdSchema,
  ordersQuerySchema,
} from '../schemas/order.schema.js';

type OrderRow = RowDataPacket & Order;
type OrderProductRow = RowDataPacket & OrderProduct;

/**
 * Crear una nueva orden
 * @param req - Request con datos de la orden
 * @param res - Response con la orden creada
 */
export async function createOrder(req: Request, res: Response): Promise<Response | void> {
  try {
    // Validar datos de entrada
    const validatedData = createOrderSchema.parse(req.body);
    const usuario_id = req.auth!.id;
    const isAdmin = req.auth!.role === 'ADMINISTRADOR';

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
      const productDetails: any[] = [];

      // Obtener detalles de cada producto (simulado - en un entorno real consultaríamos el servicio de productos)
      for (const producto of validatedData.productos) {
        // Por ahora, usamos precios simulados basados en el producto_id
        const precio = Math.floor(Math.random() * 2000000) + 500000; // Precio entre 500k y 2.5M
        const descuento = Math.floor(Math.random() * 20); // Descuento entre 0% y 20%
        const subtotal = precio * producto.cantidad * (1 - descuento / 100);
        total += subtotal;

        productDetails.push({
          producto_id: producto.producto_id,
          cantidad: producto.cantidad,
          precio,
          descuento,
          nombre: `Producto Premium ${producto.producto_id}`,
          marca: ['Samsung', 'Apple', 'ASUS', 'Logitech', 'Sony'][Math.floor(Math.random() * 5)],
          modelo: `Modelo-${producto.producto_id}-${new Date().getFullYear()}`,
          imagen: `https://example.com/images/producto-${producto.producto_id}.jpg`,
        });
      }

      // Crear la orden
      const [orderResult] = await db.query<ResultSetHeader>(
        `INSERT INTO orders (user_id, correo_usuario, direccion, nombre_completo, estado, total, fecha_pago) 
         VALUES (?, ?, ?, ?, 'pendiente', ?, NOW())`,
        [
          validatedData.user_id,
          validatedData.correo_usuario,
          validatedData.direccion,
          validatedData.nombre_completo,
          total,
        ]
      );

      const ordenId = orderResult.insertId;

      // Insertar productos de la orden
      for (const product of productDetails) {
        await db.query(
          `INSERT INTO order_products (orden_id, producto_id, nombre, precio, descuento, marca, modelo, cantidad, imagen)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ordenId,
            product.producto_id,
            product.nombre,
            product.precio,
            product.descuento,
            product.marca,
            product.modelo,
            product.cantidad,
            product.imagen,
          ]
        );
      }

      // Confirmar transacción
      await db.query('COMMIT');

      // Obtener la orden creada con sus productos
      const [newOrder] = await db.query<OrderRow[]>(
        `SELECT 
          orden_id,
          user_id,
          correo_usuario,
          direccion,
          nombre_completo,
          estado,
          total,
          DATE_FORMAT(fecha_pago, '%Y-%m-%dT%H:%i:%s.000Z') as fecha_pago,
          DATE_FORMAT(fecha_entrega, '%Y-%m-%dT%H:%i:%s.000Z') as fecha_entrega
        FROM orders WHERE orden_id = ?`,
        [ordenId]
      );

      const [orderProducts] = await db.query<OrderProductRow[]>(
        'SELECT * FROM order_products WHERE orden_id = ?',
        [ordenId]
      );

      if (!newOrder[0]) {
        throw new Error("No se pudo crear la orden");
      }
      const response: OrderResponseDTO = {
        ...newOrder[0],
        productos: orderProducts,
      };

      res.status(201).json({
        message: 'Orden creada exitosamente',
        data: response,
      });
    } catch (error) {
      // Revertir transacción en caso de error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
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

/**
 * Obtener órdenes con paginación y filtros
 * @param req - Request con parámetros de consulta
 * @param res - Response con órdenes paginadas
 */
export async function getOrders(req: Request, res: Response): Promise<Response | void> {
  try {
    // Validar parámetros de consulta
    const validatedQuery = ordersQuerySchema.parse(req.query);
    const {
      page,
      limit,
      user_id,
      estado,
      fecha_desde,
      fecha_hasta,
      sort,
      order,
    } = validatedQuery;

    const usuario_id = req.auth!.id;
    const isAdmin = req.auth!.role === 'ADMINISTRADOR';

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
      FROM orders
      WHERE 1=1
    `;

    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
    const queryParams: any[] = [];

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
    } else if (sort === 'total') {
      baseQuery += ` ORDER BY total ${order}`;
    } else if (sort === 'estado') {
      baseQuery += ` ORDER BY estado ${order}`;
    }

    // Obtener total de registros
    const [totalResult] = await db.query<RowDataPacket[]>(
      countQuery,
      queryParams
    );
    if (!totalResult[0]) {
      throw new Error("No se pudo obtener el total de órdenes");
    }
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
    const [orders] = await db.query<OrderRow[]>(baseQuery, queryParams);

    // Obtener productos para cada orden
    const ordersWithProducts: OrderResponseDTO[] = [];
    for (const order of orders) {
      const [products] = await db.query<OrderProductRow[]>(
        'SELECT * FROM order_products WHERE orden_id = ?',
        [order.orden_id]
      );
      ordersWithProducts.push({
        ...order,
        productos: products,
      });
    }

    const response: OrdersPaginatedResponse = {
      total,
      pages,
      first,
      next,
      prev,
      data: ordersWithProducts,
    };

    res.status(200).json(response);
  } catch (error: any) {
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

/**
 * Obtener orden por ID
 * @param req - Request con ID de la orden
 * @param res - Response con la orden encontrada
 */
export async function getOrderById(req: Request, res: Response): Promise<Response | void> {
  try {
    // Validar parámetro ID
    const { id } = orderIdSchema.parse(req.params);
    const usuario_id = req.auth!.id;
    const isAdmin = req.auth!.role === 'ADMINISTRADOR';

    // Buscar la orden
    const [order] = await db.query<OrderRow[]>(
      `SELECT 
        orden_id,
        user_id,
        correo_usuario,
        direccion,
        nombre_completo,
        estado,
        total,
        DATE_FORMAT(fecha_pago, '%Y-%m-%dT%H:%i:%s.000Z') as fecha_pago,
        DATE_FORMAT(fecha_entrega, '%Y-%m-%dT%H:%i:%s.000Z') as fecha_entrega
      FROM orders WHERE orden_id = ?`,
      [id]
    );
    if (!order[0]) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

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
    const [products] = await db.query<OrderProductRow[]>(
      'SELECT * FROM order_products WHERE orden_id = ?',
      [id]
    );

    const response: OrderResponseDTO = {
      ...order[0],
      productos: products,
    };

    res.status(200).json({ data: response });
  } catch (error: any) {
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

/**
 * Actualizar orden
 * @param req - Request con ID y datos a actualizar
 * @param res - Response con la orden actualizada
 */
export async function updateOrder(req: Request, res: Response): Promise<Response | void> {
  try {
    // Validar parámetro ID y datos
    const { id } = orderIdSchema.parse(req.params);
    const validatedData = updateOrderSchema.parse(req.body);
    const usuario_id = req.auth!.id;
    const isAdmin = req.auth!.role === 'ADMINISTRADOR';

    // Verificar que la orden existe
    const [existingOrder] = await db.query<RowDataPacket[]>(
      'SELECT user_id, estado FROM orders WHERE orden_id = ?',
      [id]
    );

    if (!existingOrder[0]) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    if (existingOrder.length === 0) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    // Verificar permisos
    const canUpdateStatus = isAdmin;
    const canUpdateAddress = isAdmin || existingOrder[0].user_id === usuario_id;

    if (validatedData.estado && !canUpdateStatus) {
      return res.status(403).json({
        message:
          'Solo los administradores pueden cambiar el estado de la orden',
      });
    }

    if (validatedData.direccion && !canUpdateAddress) {
      return res.status(403).json({
        message: 'No tienes permisos para actualizar esta orden',
      });
    }

    // Construir consulta de actualización
    const updateFields: string[] = [];
    const updateValues: any[] = [];

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
    await db.query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE orden_id = ?`,
      updateValues
    );

    // Obtener la orden actualizada
    const [updatedOrder] = await db.query<OrderRow[]>(
      `SELECT 
        orden_id,
        user_id,
        correo_usuario,
        direccion,
        nombre_completo,
        estado,
        total,
        DATE_FORMAT(fecha_pago, '%Y-%m-%dT%H:%i:%s.000Z') as fecha_pago,
        DATE_FORMAT(fecha_entrega, '%Y-%m-%dT%H:%i:%s.000Z') as fecha_entrega
      FROM orders WHERE orden_id = ?`,
      [id]
    );

    if (!updatedOrder[0]) {      throw new Error("No se pudo actualizar la orden");    }
    const [products] = await db.query<OrderProductRow[]>(
      'SELECT * FROM order_products WHERE orden_id = ?',
      [id]
    );

    const response: OrderResponseDTO = {
      orden_id: updatedOrder[0].orden_id!,
      user_id: updatedOrder[0].user_id!,
      correo_usuario: updatedOrder[0].correo_usuario!,
      direccion: updatedOrder[0].direccion!,
      nombre_completo: updatedOrder[0].nombre_completo!,
      estado: updatedOrder[0].estado!,
      total: updatedOrder[0].total!,
      ...(updatedOrder[0].fecha_pago && { fecha_pago: updatedOrder[0].fecha_pago }),
      ...(updatedOrder[0].fecha_entrega && { fecha_entrega: updatedOrder[0].fecha_entrega }),
      productos: products,
    };

    res.status(200).json({
      message: 'Orden actualizada exitosamente',
      data: response,
    });
  } catch (error: any) {
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

/**
 * Eliminar orden
 * @param req - Request con ID de la orden
 * @param res - Response de confirmación
 */
export async function deleteOrder(req: Request, res: Response): Promise<Response | void> {
  try {
    // Validar parámetro ID
    const { id } = orderIdSchema.parse(req.params);
    const usuario_id = req.auth!.id;
    const isAdmin = req.auth!.role === 'ADMINISTRADOR';

    // Verificar que la orden existe
    const [existingOrder] = await db.query<RowDataPacket[]>(
      'SELECT user_id, estado FROM orders WHERE orden_id = ?',
      [id]
    );

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
    await db.query('DELETE FROM orders WHERE orden_id = ?', [id]);

    res.status(200).json({ message: 'Orden eliminada exitosamente' });
  } catch (error: any) {
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

/**
 * Obtener estadísticas de órdenes del usuario
 * @param req - Request con datos del usuario
 * @param res - Response con estadísticas
 */
export async function getOrderStats(req: Request, res: Response): Promise<Response | void> {
  try {
    const usuario_id = req.auth!.id;
    const isAdmin = req.auth!.role === 'ADMINISTRADOR';

    let userCondition = '';
    const queryParams: any[] = [];

    // Si no es admin, solo puede ver sus propias estadísticas
    if (!isAdmin) {
      userCondition = 'WHERE user_id = ?';
      queryParams.push(usuario_id);
    }

    // Obtener estadísticas generales
    const [stats] = await db.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_ordenes,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'procesando' THEN 1 ELSE 0 END) as procesando,
        SUM(CASE WHEN estado = 'enviado' THEN 1 ELSE 0 END) as enviadas,
        SUM(CASE WHEN estado = 'entregado' THEN 1 ELSE 0 END) as entregadas,
        SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END) as canceladas,
        COALESCE(SUM(total), 0) as total_gastado,
        COALESCE(AVG(total), 0) as promedio_orden
      FROM orders ${userCondition}`,
      queryParams
    );

    // Obtener productos más comprados
    const [topProducts] = await db.query<RowDataPacket[]>(
      `SELECT 
        op.nombre,
        op.marca,
        op.modelo,
        SUM(op.cantidad) as total_comprado,
        COUNT(DISTINCT op.orden_id) as veces_ordenado
      FROM order_products op
      JOIN orders o ON op.orden_id = o.orden_id
      ${userCondition ? 'WHERE o.user_id = ?' : ''}
      GROUP BY op.producto_id, op.nombre, op.marca, op.modelo
      ORDER BY total_comprado DESC
      LIMIT 5`,
      queryParams
    );

    res.status(200).json({
      data: {
        estadisticas: stats[0],
        productos_favoritos: topProducts,
      },
    });
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}