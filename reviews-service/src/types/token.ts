export type JWTData = {
  id: string;
  role: string;
};

// Extender el tipo Request de Express para incluir auth
declare global {
  namespace Express {
    interface Request {
      auth?: JWTData;
    }
  }
}