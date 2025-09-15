import type { Request, Response } from 'express';
import { db } from '../db.js';
import type { RowDataPacket } from 'mysql2';
import { z } from 'zod';

// Estados válidos y transiciones permitidas
const ESTADOS_VALIDOS = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'] as const;
type EstadoOrden = typeof ESTADOS_VALIDOS[number];

// Definir transiciones válidas de estado
const TRANSICIONES_VALIDAS: Record<EstadoOrden, EstadoOrden[]> = {
  pendiente: ['procesando', 'cancelado'],
  procesando: ['enviado', 'cancelado'],
  enviado: ['entregado'],
  entregado: [], // Estado final
  cancelado: [], // Estado final
};

// Esquemas de validación
const updateStatusSchema = z.object({
  estado: z.enum(ESTADOS_VALIDOS),
  motivo: z.string().min(1).max(500).optional(),
  fecha_entrega: z.string().datetime().optional(),
});

const orderIdSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)),
});

/**
 * Actualizar estado de una orden con validaciones de flujo
 * @param req - Request con ID de orden y nuevo estado
 * @param res - Response con confirmación
 */
export async function updateOrderStatus(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = orderIdSchema.parse(req.params);
    const validatedData = updateStatusSchema.parse(req.body);
    const usuario_id = req.auth!.id;
    const isAdmin = req.auth!.role === 'ADMINISTRADOR';

    // Solo administradores pueden cambiar estados
    if (!isAdmin) {
      return res.status(403).json({
        message: 'Solo los administradores pueden cambiar el estado de las órdenes',
      });
    }

    // Obtener orden actual
    const [orderResult] = await db.query<RowDataPacket[]>(
      'SELECT orden_id, user_id, estado, correo_usuario, nombre_completo FROM orders WHERE orden_id = ?',
      [id]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    const order = orderResult[0];
    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }
    const estadoActual = order.estado as EstadoOrden;
    const nuevoEstado = validatedData.estado;

    // Validar transición de estado
    if (!TRANSICIONES_VALIDAS[estadoActual].includes(nuevoEstado)) {
      return res.status(400).json({
        message: `Transición de estado inválida: de '${estadoActual}' a '${nuevoEstado}'`,
        transiciones_validas: TRANSICIONES_VALIDAS[estadoActual],
      });
    }

    // Preparar campos a actualizar
    const updateFields: string[] = ['estado = ?'];
    const updateValues: any[] = [nuevoEstado];

    // Si se marca como entregado, establecer fecha de entrega
    if (nuevoEstado === 'entregado') {
      updateFields.push('fecha_entrega = ?');
      updateValues.push(validatedData.fecha_entrega || new Date().toISOString());
    }

    updateValues.push(id);

    // Actualizar orden
    await db.query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE orden_id = ?`,
      updateValues
    );

    // Registrar cambio de estado en historial
    await db.query(
      `INSERT INTO order_status_history (orden_id, estado_anterior, estado_nuevo, motivo, changed_by, changed_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [id, estadoActual, nuevoEstado, validatedData.motivo || null, usuario_id]
    );

    // Obtener orden actualizada
    const [updatedOrder] = await db.query<RowDataPacket[]>(
      `SELECT 
        orden_id,
        user_id,
        correo_usuario,
        nombre_completo,
        estado,
        total,
        DATE_FORMAT(fecha_pago, '%Y-%m-%dT%H:%i:%s.000Z') as fecha_pago,
        DATE_FORMAT(fecha_entrega, '%Y-%m-%dT%H:%i:%s.000Z') as fecha_entrega
      FROM orders WHERE orden_id = ?`,
      [id]
    );

    res.status(200).json({
      message: `Estado de la orden actualizado a '${nuevoEstado}'`,
      data: updatedOrder[0],
      transicion: {
        de: estadoActual,
        a: nuevoEstado,
        motivo: validatedData.motivo,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: error.errors,
      });
    }
    console.error('Error al actualizar estado de orden:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

/**
 * Obtener historial de cambios de estado de una orden
 * @param req - Request con ID de orden
 * @param res - Response con historial
 */
export async function getOrderStatusHistory(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = orderIdSchema.parse(req.params);
    const usuario_id = req.auth!.id;
    const isAdmin = req.auth!.role === 'ADMINISTRADOR';

    // Verificar que la orden existe
    const [order] = await db.query<RowDataPacket[]>(
      'SELECT user_id FROM orders WHERE orden_id = ?',
      [id]
    );

    if (order.length === 0) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    // Verificar permisos
    const orderData = order[0];
    if (!orderData) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }
    if (!isAdmin && orderData.user_id !== usuario_id) {
      return res.status(403).json({
        message: 'No tienes permisos para ver el historial de esta orden',
      });
    }

    // Obtener historial de cambios
    const [history] = await db.query<RowDataPacket[]>(
      `SELECT 
        estado_anterior,
        estado_nuevo,
        motivo,
        changed_by,
        DATE_FORMAT(changed_at, '%Y-%m-%dT%H:%i:%s.000Z') as fecha_cambio
      FROM order_status_history 
      WHERE orden_id = ?
      ORDER BY changed_at ASC`,
      [id]
    );

    res.status(200).json({
      data: history,
      total_cambios: history.length,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'ID inválido',
        errors: error.errors,
      });
    }
    console.error('Error al obtener historial de estado:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

/**
 * Cancelar una orden
 * @param req - Request con ID de orden y motivo
 * @param res - Response con confirmación
 */
export async function cancelOrder(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = orderIdSchema.parse(req.params);
    const { motivo } = z.object({
      motivo: z.string().min(1).max(500),
    }).parse(req.body);
    
    const usuario_id = req.auth!.id;
    const isAdmin = req.auth!.role === 'ADMINISTRADOR';

    // Obtener orden actual
    const [orderResult] = await db.query<RowDataPacket[]>(
      'SELECT user_id, estado, correo_usuario, nombre_completo FROM orders WHERE orden_id = ?',
      [id]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    const order = orderResult[0];
    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }
    
    // Verificar permisos (propietario o admin)
    if (!isAdmin && order.user_id !== usuario_id) {
      return res.status(403).json({
        message: 'No tienes permisos para cancelar esta orden',
      });
    }

    const estadoActual = order.estado as EstadoOrden;

    // Verificar que se puede cancelar
    if (!TRANSICIONES_VALIDAS[estadoActual].includes('cancelado')) {
      return res.status(400).json({
        message: `No se puede cancelar una orden en estado '${estadoActual}'`,
        estados_cancelables: Object.keys(TRANSICIONES_VALIDAS).filter(
          estado => TRANSICIONES_VALIDAS[estado as EstadoOrden].includes('cancelado')
        ),
      });
    }

    // Cancelar orden
    await db.query(
      'UPDATE orders SET estado = "cancelado" WHERE orden_id = ?',
      [id]
    );

    // Registrar cancelación en historial
    await db.query(
      `INSERT INTO order_status_history (orden_id, estado_anterior, estado_nuevo, motivo, changed_by, changed_at)
       VALUES (?, ?, 'cancelado', ?, ?, NOW())`,
      [id, estadoActual, motivo, usuario_id]
    );

    res.status(200).json({
      message: 'Orden cancelada exitosamente',
      motivo,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: error.errors,
      });
    }
    console.error('Error al cancelar orden:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

/**
 * Obtener estadísticas de estados de órdenes
 * @param req - Request
 * @param res - Response con estadísticas
 */
export async function getOrderStatusStats(req: Request, res: Response): Promise<Response | void> {
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

    // Obtener estadísticas por estado
    const [statusStats] = await db.query<RowDataPacket[]>(
      `SELECT 
        estado,
        COUNT(*) as cantidad,
        SUM(total) as valor_total,
        AVG(total) as valor_promedio
      FROM orders ${userCondition}
      GROUP BY estado
      ORDER BY 
        CASE estado
          WHEN 'pendiente' THEN 1
          WHEN 'procesando' THEN 2
          WHEN 'enviado' THEN 3
          WHEN 'entregado' THEN 4
          WHEN 'cancelado' THEN 5
        END`,
      queryParams
    );

    // Obtener tendencias por mes (últimos 6 meses)
    const [monthlyTrends] = await db.query<RowDataPacket[]>(
      `SELECT 
        DATE_FORMAT(fecha_pago, '%Y-%m') as mes,
        estado,
        COUNT(*) as cantidad
      FROM orders 
      ${userCondition} ${userCondition ? 'AND' : 'WHERE'} fecha_pago >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(fecha_pago, '%Y-%m'), estado
      ORDER BY mes DESC, estado`,
      queryParams
    );

    // Calcular tiempo promedio por estado
    const [avgTimes] = await db.query<RowDataPacket[]>(
      `SELECT 
        estado_nuevo as estado,
        AVG(TIMESTAMPDIFF(HOUR, 
          LAG(changed_at) OVER (PARTITION BY orden_id ORDER BY changed_at),
          changed_at
        )) as horas_promedio
      FROM order_status_history osh
      JOIN orders o ON osh.orden_id = o.orden_id
      ${userCondition ? 'WHERE o.user_id = ?' : ''}
      GROUP BY estado_nuevo`,
      queryParams
    );

    res.status(200).json({
      data: {
        estadisticas_por_estado: statusStats,
        tendencias_mensuales: monthlyTrends,
        tiempo_promedio_por_estado: avgTimes,
        estados_disponibles: ESTADOS_VALIDOS,
        transiciones_validas: TRANSICIONES_VALIDAS,
      },
    });
  } catch (error: any) {
    console.error('Error al obtener estadísticas de estados:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}