export interface Review {
    calificacion_id: number;
    producto_id: number;
    usuario_id: string;
    calificacion: number;
    comentario?: string;
    fecha: string;
}
export interface ReviewCreateDTO {
    producto_id: number;
    calificacion: number;
    comentario?: string;
}
export interface ReviewUpdateDTO {
    calificacion?: number;
    comentario?: string;
}
export interface ReviewResponseDTO {
    calificacion_id: number;
    producto_id: number;
    usuario_id: string;
    nombre_usuario: string;
    calificacion: number;
    comentario?: string;
    fecha: string;
}
export interface ReviewsPaginatedResponse {
    total: number;
    pages: number;
    first: number;
    next: number | null;
    prev: number | null;
    data: ReviewResponseDTO[];
}
//# sourceMappingURL=review.d.ts.map