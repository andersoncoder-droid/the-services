import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();
export const db = mysql.createPool({
    host: process.env.DATABASE_HOST || "localhost",
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "Rev1ews@2024!",
    database: process.env.DATABASE_NAME || "reviews",
    waitForConnections: true,
    connectionLimit: 10,
});
//# sourceMappingURL=db.js.map