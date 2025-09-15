import type { Request, Response } from 'express';
import { db } from '../db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type {
  ReviewResponseDTO,
  ReviewsPaginatedResponse,
} from '../types/review';
import {
  createReviewSchema,
  updateReviewSchema,
  reviewIdSchema,
  reviewsQuerySchema,
  productIdSchema,
} from '../schemas/review.schema';

type ReviewRow = RowDataPacket & ReviewResponseDTO;

// Crear una nueva reseña
export async function createReview(req: Request, res: Response) {
  try {
    // Validar datos de entrada
    const validatedData = createReviewSchema.parse(req.body);
    const usuario_id = req.auth!.id;

    // Verificar si el usuario ya ha reseñado este producto
    const [existingReview] = await db.query<RowDataPacket[]>(
      'SELECT calificacion_id FROM calificaciones WHERE producto_id = ? AND usuario_id = ?',
      [validatedData.producto_id, usuario_id]
    );

    if (existingReview.length > 0) {
      return res.status(409).json({
        message:
          'Ya has reseñado este producto. Puedes actualizar tu reseña existente.',
      });
    }

    // Crear la reseña
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO calificaciones (producto_id, usuario_id, calificacion, comentario, fecha) VALUES (?, ?, ?, ?, NOW())',
      [
        validatedData.producto_id,
        usuario_id,
        validatedData.calificacion,
        validatedData.comentario || null,
      ]
    );

    // Obtener la reseña creada
    const [newReview] = await db.query<ReviewRow[]>(
      `SELECT 
        c.calificacion_id,
        c.producto_id,
        c.usuario_id,
        'Usuario' as nombre_usuario,
        c.calificacion,
        c.comentario,
        DATE_FORMAT(c.fecha, '%Y-%m-%dT%H:%i:%s.000Z') as fecha
      FROM calificaciones c
      WHERE c.calificacion_id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Reseña creada exitosamente',
      data: newReview[0],
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Datos de entrada inválidos',
        errors: error.errors,
      });
    }
    console.error('Error al crear reseña:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// Obtener reseñas con paginación y filtros
export async function getReviews(req: Request, res: Response) {
  try {
    // Validar parámetros de consulta
    const validatedQuery = reviewsQuerySchema.parse(req.query);
    const {
      page,
      limit,
      producto_id,
      usuario_id,
      sort,
      order,
      calificacion_min,
      calificacion_max,
    } = validatedQuery;

    // Construir la consulta base
    let baseQuery = `
      SELECT 
        c.calificacion_id,
        c.producto_id,
        c.usuario_id,
        'Usuario' as nombre_usuario,
        c.calificacion,
        c.comentario,
        DATE_FORMAT(c.fecha, '%Y-%m-%dT%H:%i:%s.000Z') as fecha
      FROM calificaciones c
      WHERE 1=1
    `;

    let countQuery = 'SELECT COUNT(*) as total FROM calificaciones c WHERE 1=1';
    const queryParams: any[] = [];

    // Aplicar filtros
    if (producto_id) {
      baseQuery += ' AND c.producto_id = ?';
      countQuery += ' AND c.producto_id = ?';
      queryParams.push(producto_id);
    }

    if (usuario_id) {
      baseQuery += ' AND c.usuario_id = ?';
      countQuery += ' AND c.usuario_id = ?';
      queryParams.push(usuario_id);
    }

    if (calificacion_min) {
      baseQuery += ' AND c.calificacion >= ?';
      countQuery += ' AND c.calificacion >= ?';
      queryParams.push(calificacion_min);
    }

    if (calificacion_max) {
      baseQuery += ' AND c.calificacion <= ?';
      countQuery += ' AND c.calificacion <= ?';
      queryParams.push(calificacion_max);
    }

    // Aplicar ordenamiento
    if (sort === 'fecha') {
      baseQuery += ` ORDER BY c.fecha ${order}`;
    } else if (sort === 'calificacion') {
      baseQuery += ` ORDER BY c.calificacion ${order}`;
    }

    // Obtener total de registros
    const [totalResult] = await db.query<RowDataPacket[]>(
      countQuery,
      queryParams
    );
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
    const [reviews] = await db.query<ReviewRow[]>(baseQuery, queryParams);

    const response: ReviewsPaginatedResponse = {
      total,
      pages,
      first,
      next,
      prev,
      data: reviews,
    };

    res.status(200).json(response);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Parámetros de consulta inválidos',
        errors: error.errors,
      });
    }
    console.error('Error al obtener reseñas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// Obtener reseña por ID
export async function getReviewById(req: Request, res: Response) {
  try {
    // Validar parámetro ID
    const { id } = reviewIdSchema.parse(req.params);

    // Buscar la reseña
    const [review] = await db.query<ReviewRow[]>(
      `SELECT 
        c.calificacion_id,
        c.producto_id,
        c.usuario_id,
        'Usuario' as nombre_usuario,
        c.calificacion,
        c.comentario,
        DATE_FORMAT(c.fecha, '%Y-%m-%dT%H:%i:%s.000Z') as fecha
      FROM calificaciones c
      WHERE c.calificacion_id = ?`,
      [id]
    );

    if (review.length === 0) {
      return res.status(404).json({ message: 'Reseña no encontrada' });
    }

    res.status(200).json({ data: review[0] });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'ID inválido',
        errors: error.errors,
      });
    }
    console.error('Error al obtener reseña:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// Actualizar reseña
export async function updateReview(req: Request, res: Response) {
  try {
    // Validar parámetro ID y datos
    const { id } = reviewIdSchema.parse(req.params);
    const validatedData = updateReviewSchema.parse(req.body);
    const usuario_id = req.auth!.id;
    const isAdmin = req.auth!.role === 'ADMINISTRADOR';

    // Verificar que la reseña existe
    const [existingReview] = await db.query<RowDataPacket[]>(
      'SELECT usuario_id FROM calificaciones WHERE calificacion_id = ?',
      [id]
    );

    if (existingReview.length === 0) {
      return res.status(404).json({ message: 'Reseña no encontrada' });
    }

    // Verificar permisos (propietario o admin)
    if (!isAdmin && existingReview[0].usuario_id !== usuario_id) {
      return res.status(403).json({
        message: 'No tienes permisos para actualizar esta reseña',
      });
    }

    // Construir consulta de actualización
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (validatedData.calificacion !== undefined) {
      updateFields.push('calificacion = ?');
      updateValues.push(validatedData.calificacion);
    }

    if (validatedData.comentario !== undefined) {
      updateFields.push('comentario = ?');
      updateValues.push(validatedData.comentario);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    updateValues.push(id);

    // Actualizar la reseña
    await db.query(
      `UPDATE calificaciones SET ${updateFields.join(
        ', '
      )} WHERE calificacion_id = ?`,
      updateValues
    );

    // Obtener la reseña actualizada
    const [updatedReview] = await db.query<ReviewRow[]>(
      `SELECT 
        c.calificacion_id,
        c.producto_id,
        c.usuario_id,
        'Usuario' as nombre_usuario,
        c.calificacion,
        c.comentario,
        DATE_FORMAT(c.fecha, '%Y-%m-%dT%H:%i:%s.000Z') as fecha
      FROM calificaciones c
      WHERE c.calificacion_id = ?`,
      [id]
    );

    res.status(200).json({
      message: 'Reseña actualizada exitosamente',
      data: updatedReview[0],
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: error.errors,
      });
    }
    console.error('Error al actualizar reseña:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// Eliminar reseña
export async function deleteReview(req: Request, res: Response) {
  try {
    // Validar parámetro ID
    const { id } = reviewIdSchema.parse(req.params);
    const usuario_id = req.auth!.id;
    const isAdmin = req.auth!.role === 'ADMINISTRADOR';

    // Verificar que la reseña existe
    const [existingReview] = await db.query<RowDataPacket[]>(
      'SELECT usuario_id FROM calificaciones WHERE calificacion_id = ?',
      [id]
    );

    if (existingReview.length === 0) {
      return res.status(404).json({ message: 'Reseña no encontrada' });
    }

    // Verificar permisos (propietario o admin)
    if (!isAdmin && existingReview[0].usuario_id !== usuario_id) {
      return res.status(403).json({
        message: 'No tienes permisos para eliminar esta reseña',
      });
    }

    // Eliminar la reseña
    await db.query('DELETE FROM calificaciones WHERE calificacion_id = ?', [
      id,
    ]);

    res.status(200).json({ message: 'Reseña eliminada exitosamente' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'ID inválido',
        errors: error.errors,
      });
    }
    console.error('Error al eliminar reseña:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// Obtener reseñas por producto
export async function getReviewsByProduct(req: Request, res: Response) {
  try {
    // Validar parámetro producto_id
    const { producto_id } = productIdSchema.parse(req.params);
    const validatedQuery = reviewsQuerySchema.parse(req.query);
    const { page, limit, sort, order } = validatedQuery;

    // Consulta base para reseñas del producto
    let baseQuery = `
      SELECT 
        c.calificacion_id,
        c.producto_id,
        c.usuario_id,
        'Usuario' as nombre_usuario,
        c.calificacion,
        c.comentario,
        DATE_FORMAT(c.fecha, '%Y-%m-%dT%H:%i:%s.000Z') as fecha
      FROM calificaciones c
      WHERE c.producto_id = ?
    `;

    // Aplicar ordenamiento
    if (sort === 'fecha') {
      baseQuery += ` ORDER BY c.fecha ${order}`;
    } else if (sort === 'calificacion') {
      baseQuery += ` ORDER BY c.calificacion ${order}`;
    }

    // Obtener total de registros
    const [totalResult] = await db.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM calificaciones WHERE producto_id = ?',
      [producto_id]
    );
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

    // Ejecutar consulta
    const [reviews] = await db.query<ReviewRow[]>(baseQuery, [
      producto_id,
      limit,
      offset,
    ]);

    const response: ReviewsPaginatedResponse = {
      total,
      pages,
      first,
      next,
      prev,
      data: reviews,
    };

    res.status(200).json(response);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Parámetros inválidos',
        errors: error.errors,
      });
    }
    console.error('Error al obtener reseñas del producto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
