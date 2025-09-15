export type JWTData = {
    id: string;
    role: string;
};
declare global {
    namespace Express {
        interface Request {
            auth?: JWTData;
        }
    }
}
//# sourceMappingURL=token.d.ts.map