import type { JWTData } from "../types/token.js";
export declare function generateToken({ id, role }: JWTData): string;
export declare function verifyToken(token: string): JWTData | null;
//# sourceMappingURL=jwt.d.ts.map