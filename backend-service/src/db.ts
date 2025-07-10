import sql from "mssql";
import { Cliente } from "./types";
import dotenv from "dotenv";

dotenv.config();

const config: sql.config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  port: Number(process.env.DB_PORT) || 1433,
};

let pool: sql.ConnectionPool;

/**
 * Conecta a SQL Server si aún no hay conexión
 */
export async function connectToDb() {
  if (!pool) {
    try {
      pool = await sql.connect(config); // 🛠️ Corrección: era connectToDb(config), ahora es sql.connect(config)
      console.log("✅ Conexión a la base de datos establecida");
    } catch (error) {
      console.error("❌ Error al conectar a la base de datos:", error);
      throw error;
    }
  }
}

/**
 * Inserta un batch de clientes usando inserción masiva
 */
export async function insertBatch(batch: Cliente[]): Promise<void> {
  if (!pool) {
    await connectToDb();
  }

  const table = new sql.Table("Clientes");
  table.create = false;
  table.columns.add("NombreCompleto", sql.NVarChar(100), { nullable: false });
  table.columns.add("DNI", sql.BigInt, { nullable: false });
  table.columns.add("Estado", sql.VarChar(10), { nullable: false });
  table.columns.add("FechaIngreso", sql.DateTime, { nullable: false });
  table.columns.add("EsPEP", sql.Bit, { nullable: false });
  table.columns.add("EsSujetoObligado", sql.Bit, { nullable: true });
  table.columns.add("FechaCreacion", sql.DateTime, { nullable: false });

  for (const c of batch) {
    table.rows.add(
      c.nombreCompleto,
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
