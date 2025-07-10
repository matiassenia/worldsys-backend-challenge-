import sql from "mssql";
import { Cliente } from "./types";
import dotenv from "dotenv";

dotenv.config();

const config: sql.config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  server: process.env.DB_SERVER! || "localhost",
  database: process.env.DB_NAME!,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  port: Number(process.env.DB_PORT) || 1433,
};

let pool: sql.ConnectionPool;

/**
 * Intenta conectarse a la base de datos con reintentos
 */
export async function connectWithRetry(retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      const initialConfig = {
        ...config,
        database: "master", // Conectar a la base de datos maestra para verificar la conexión
      };
      pool = await sql.connect(initialConfig);
      console.log("✅ Conexión a la base de datos establecida");

      await pool.request().query(`USE ${process.env.DB_NAME}`);
      console.log(`📚 Usando base de datos: ${process.env.DB_NAME}`);

      return;
    } catch (error) {
      console.warn(`⏳ Intento ${i + 1} fallido. Reintentando en ${delay / 1000}s...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  console.error("❌ No se pudo conectar a la base de datos después de múltiples intentos");
  throw new Error("Fallo de conexión a la base de datos");
}

/**
 * Inserta un batch de clientes usando inserción masiva
 */
export async function insertBatch(batch: Cliente[]): Promise<void> {
  if (!pool) {
    await connectWithRetry();
  }

  const table = new sql.Table("Clientes");
  table.create = false;
  table.columns.add("NombreCompleto", sql.NVarChar(100), { nullable: false });
  table.columns.add("DNI", sql.BigInt, { nullable: false });
  table.columns.add("Estado", sql.VarChar(10), { nullable: false });
  table.columns.add("FechaIngreso", sql.Date, { nullable: false });
  table.columns.add("EsPEP", sql.Bit, { nullable: false });
  table.columns.add("EsSujetoObligado", sql.Bit, { nullable: true });
  table.columns.add("FechaCreacion", sql.DateTime, { nullable: false });

  for (const c of batch) {
    if (
      typeof c.nombreCompleto !== "string" ||
      typeof c.estado !== "string" ||
      isNaN(c.dni) ||
      isNaN(c.fechaIngreso.getTime())
    ) {
      console.warn("❌ Datos inválidos omitido:", c);
      continue; // Omitir registros con datos inválidos
    }
    table.rows.add(
      c.nombreCompleto.substring(0, 100), // Limitar a 100 caracteres
      c.dni,
      c.estado,
      c.fechaIngreso,
      c.esPep ? 1 : 0,
      c.esSujetoObligado !== null ? (c.esSujetoObligado ? 1 : 0) : null,
      c.fechaCreacion
    );
  }

  try {
    const request = pool.request();
    await request.bulk(table);
    console.log(`📥 Batch de ${batch.length} clientes insertado correctamente`);
  } catch (error) {
    console.error("❌ Error al insertar batch en la base de datos:", error);
    throw error;
  }
}
