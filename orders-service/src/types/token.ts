export interface JWTData {
  id: string;
  nombre: string;
  correo: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Extender el tipo Request de Express para incluir auth
declare global {
  namespace Express {
    interface Request {
      auth?: JWTData;
    }
  }
}