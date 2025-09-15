import jwt from "jsonwebtoken";
const SECRET_KEY = process.env.JWT_SECRET ||
    "@y*&0a%K%7P0t@uQ^38HN$y4Z^PK#0zE7dem700Bbf&pC6HF$aU^ARkE@u$nn";
export function generateToken({ id, role }) {
    return jwt.sign({ id, role }, SECRET_KEY, { expiresIn: "30d" });
}
export function verifyToken(token) {
    try {
        // Remover 'Bearer ' si está presente
        const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
        const decoded = jwt.verify(cleanToken, SECRET_KEY);
        return { id: decoded.id, role: decoded.role };
    }
    catch (err) {
        return null;
    }
}
//# sourceMappingURL=jwt.js.map