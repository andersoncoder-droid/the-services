export interface Order {
  orden_id: number;
  user_id: string;
  correo_usuario: string;
  direccion: string;
  nombre_completo: string;
  estado: string;
  total: number;
  fecha_pago?: string;
  fecha_entrega?: string;
}

export interface OrderProduct {
  orden_productos_id: number;
  orden_id: number;
  producto_id: number;
  nombre: string;
  precio: number;
  descuento: number;
  marca: string;
  modelo: string;
  cantidad: number;
  imagen: string;
}

export interface OrderCreateDTO {
  user_id: string;
  correo_usuario: string;
  direccion: string;
  nombre_completo: string;
  productos: {
    producto_id: number;
    cantidad: number;
  }[];
}

export interface OrderUpdateDTO {
  estado?: string;
  direccion?: string;
  fecha_entrega?: string;
}

export interface OrderResponseDTO {
  orden_id: number;
  user_id: string;
  correo_usuario: string;
  direccion: string;
  nombre_completo: string;
  estado: string;
  total: number;
  fecha_pago?: string;
  fecha_entrega?: string;
  productos: OrderProduct[];
}

export interface OrdersPaginatedResponse {
  total: number;
  pages: number;
  first: number;
  next: number | null;
  prev: number | null;
  data: OrderResponseDTO[];
}