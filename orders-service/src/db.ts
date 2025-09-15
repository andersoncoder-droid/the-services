import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "orders_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Crear pool de conexiones
export const db = mysql.createPool(dbConfig);

// Función para probar la conexión
export async function testConnection(): Promise<void> {
  try {
    const connection = await db.getConnection();
    console.log("✅ Conexión a la base de datos establecida correctamente");
    connection.release();
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error);
    throw error;
  }
}

// Función para cerrar todas las conexiones
export async function closeConnection(): Promise<void> {
  try {
    await db.end();
    console.log("🔌 Conexiones de base de datos cerradas");
  } catch (error) {
    console.error("❌ Error al cerrar conexiones:", error);
  }
}