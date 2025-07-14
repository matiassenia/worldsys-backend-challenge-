import fs from "fs";
import readline from "readline";
import { Cliente } from "./types";

/**
 * Procesa un archivo línea por línea, valida los registros y los agrupa en batches para su posterior inserción.
 * Los registros inválidos son descartados y logueados.
 * 
 * @param filePath Ruta al archivo .dat
 * @param onBatch Callback para procesar cada batch de clientes
 * @param batchSize Tamaño del batch para la inserción masiva (default: 1000)
 */

export async function processFile(
  filePath: string,
  onBatch: (batch: Cliente[]) => Promise<void>,
  batchSize: number = 1000
): Promise<void> {
  const queue: Cliente[][] = [];
  let readingCompleted = false;
  let validCount = 0;
  let invalidCount = 0;
  let lineNumber = 0;
  
  // Worker asincrónico que procesa los batches en paralelo a la lectura
  const worker = async () => {
    while (!readingCompleted || queue.length > 0) {
      const batch = queue.shift();
      if (batch) {
        try {
          await onBatch(batch);
        } catch (err) {
          console.error("❌ Error al insertar batch en la base de datos:", err);
        }
      } else {
        await new Promise((res) => setTimeout(res, 50));
      }
    }
  };

  const reader = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let currentBatch: Cliente[] = [];

  const parseFecha = (fechaStr: string): Date => {
    const [mes, dia, anio] = fechaStr.split("/");
    const fecha = new Date(`${anio}-${mes}-${dia}`);
    return isNaN(fecha.getTime()) ? new Date("invalid") : fecha;
  };

  const parseBoolean = (value: string): boolean => value.trim().toLowerCase() === "true";
  const parseOptionalBoolean = (value: string): boolean | null => {
    return value.trim() === "" ? null : parseBoolean(value);
  };  

  const processing = new Promise<void>((resolve) => {
    reader.on("line", (line: string) => {
      lineNumber++;
      const fields = line.split("|");

      if (fields.length < 7) {
        console.warn(`Linea ${lineNumber} invalida (campos faltantes): ${line}`);
        invalidCount++;
        return;

      }

      // Desestructuración de campos
      const [nombre, apellido, dni, estado, fechaIngreso, esPep, esSujetoObligado] = fields;

      //Construcción del objeto Cliente
      const cliente: Cliente = {
        nombreCompleto: `${nombre.trim()} ${apellido.trim()}`,
        dni: parseInt(dni),
        estado: estado.trim(),
        fechaIngreso: parseFecha(fechaIngreso),
        esPep: parseBoolean(esPep),
        esSujetoObligado: parseOptionalBoolean(esSujetoObligado),
        fechaCreacion: new Date(),
      };

      //Validaciónes adicionales
      const fechaValida = !isNaN(cliente.fechaIngreso.getTime());
      const dniValido = !isNaN(cliente.dni) && cliente.dni < 99999999;
      const estadoValido = ["activo", "inactivo"].includes(cliente.estado.toLowerCase());

      // Si alguna validación falla, descartamos el registro
      if (!fechaValida || !dniValido || !estadoValido) {
        console.warn(`Linea ${lineNumber} inválida (DNI, fecha o estado): ${line}`);
        invalidCount++;
        return;
      }

      currentBatch.push(cliente);
      validCount++;

      // Si el batch alcanza el tamaño máximo, lo procesamos
      if (currentBatch.length === batchSize) {
        queue.push(currentBatch);
        currentBatch = [];
      }
    });

    reader.on("close", () => {
      if (currentBatch.length > 0) {
        queue.push(currentBatch);
      }
      readingCompleted = true;
      resolve();
    });
  });

  // Ejecutamos el worker y la lectura del archivo en paralelo
  await Promise.all([worker(), processing]);

// Log final del proceso
  console.log("✅ Procesamiento completado");
  console.log(`✔️  Líneas válidas procesadas: ${validCount}`);
  console.log(`❌ Líneas inválidas descartadas: ${invalidCount}`);
}



//**Helper Functions */
/**
 * Parsea fechas en formato MM/DD/YYYY. Devuelve un objeto Date.
 *
 * @param fechaStr - Fecha en string (ej: "11/13/2021")
 * @returns Date válido o inválido si la fecha no se puede parsear
 */

function parseFecha(fechaStr: string): Date {
  const [mes, dia, anio] = fechaStr.split("/");
  const fecha = new Date(`${anio}-${mes}-${dia}`);

  // Verificar si la fecha es válida
  return isNaN(fecha.getTime()) ? new Date("invalid") : fecha;
}

/**
 * Convierte un string a booleano.
 *
 * @param value - String esperado como "true" o "false"
 * @returns `true` si el valor es "true", `false` en cualquier otro caso
 */
function parseBoolean(value: string): boolean {
  return value.trim().toLowerCase() === "true";
}


/** Convierte un string opcional a bool o null.
 * @param value - String esperado como "true", "false" o vacío
 * @return `true` si el valor es "true", `false` si es "false", o `null` si el string está vacío
 */
function parseOptionalBoolean(value: string): boolean | null {
  if (value.trim() === "") return null;
  return parseBoolean(value);
}
